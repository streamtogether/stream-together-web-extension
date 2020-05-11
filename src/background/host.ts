import Peer from "peerjs";
import { IFriend, IFriendConnection } from "../Friend";
import { IFriendMessage, Message, MessageType, IPollMessage } from "../Message";

export class Host {
    /** Whether or not the current Host instance is initialized */
    public isReady = false;

    /** The current id */
    public id: string | null = null;

    /** The current user's chosen displayName */
    public displayName = "";

    /** See: https://developer.chrome.com/extensions/runtime#type-Port */
    #port: chrome.runtime.Port;

    /** The underlying peerjs Peer instance */
    #peer = new Peer();

    /** Map of friend ids to friends  */
    #friends = new Map<string, IFriendConnection>();

    /** List of friend change subscribers */
    private friendChangeSubscribers: ((count: number, delta: number) => void)[] = [];

    /** Whether or not we've notified the current user of their party size */
    private hasNotifiedPartySize = false;

    public constructor(port: chrome.runtime.Port) {
        this.#port = port;

        this.#peer.on("open", (id: string) => {
            this.isReady = true;
            this.id = id;
        });

        port.onMessage.addListener(message => {
            this.#friends.forEach(friend => friend.connection?.send(message));
        });

        this.#peer.on("connection", (conn: Peer.DataConnection) => {
            this.onPeerConnectToHost(conn);
        });
    }

    /**
     * Subscribe to friend changes
     * @param cb The callback to call when the friends list changes
     */
    public subscribeToFriendChanges(cb: (count: number, delta: number) => void): void {
        this.friendChangeSubscribers.push(cb);
    }

    /**
     * Connects the current host to the given peer
     * @param hostId The id of the host to connect to
     */
    public connectToHost(hostId: string): void {
        const conn = this.#peer.connect(hostId);

        // Handle the conenction to host but don't notify friend changes until the host sends the friend message
        conn.on("open", () => this.handleConnect(conn, false));
    }

    /**
     * Handle a new peer connection
     * @param conn The underlying data connection
     */
    private handleConnect(conn: Peer.DataConnection, shouldNotify = true): void {
        const friend: IFriendConnection = { id: conn.peer, displayName: "", connection: conn };
        this.#friends.set(friend.id, friend);
        shouldNotify && this.notifyFriendChanges(1);

        conn.on("data", (data: Message) => {
            switch (data.messageType) {
                case MessageType.Friend:
                    this.handleFriendMessage(data);
                    break;
                default:
                    break;
            }

            this.#port.postMessage(data);
        });

        conn.on("close", () => {
            this.#friends.delete(friend.id);
            this.notifyFriendChanges(-1);
        });
    }

    /**
     * Handler for friend messages
     * @param message The friend message to process
     */
    private handleFriendMessage(message: IFriendMessage): void {
        const numFriendsBefore = this.#friends.size;
        // List of ids used for cleaning up friends list after updates
        const newListIds: string[] = [];

        for (const messageFriend of message.friends) {
            const existingFriend = this.#friends.get(messageFriend.id);
            const existingFriendPeerJsConnection = existingFriend?.connection;

            // Message will contain the current user id
            if (messageFriend.id !== this.id) {
                const newFriendObj = {
                    id: messageFriend.id,
                    displayName: messageFriend.displayName,
                    connection: existingFriendPeerJsConnection
                };
                this.#friends.set(messageFriend.id, newFriendObj);
                newListIds.push(messageFriend.id);
            }
        }

        // We've set the new friends, but we need to clean up any friends that weren't in the message
        this.#friends.forEach(friend => {
            if (newListIds.indexOf(friend.id) < 0) {
                // Friend entry wasn't in the list of friends we got from the host
                this.#friends.delete(friend.id);
            }
        });

        const numFriendsAfter = this.#friends.size;
        if (!this.hasNotifiedPartySize) {
            // We now know the starting party size so notify the current user
            this.notifyFriendChanges(this.#friends.size);
        } else if (numFriendsBefore !== numFriendsAfter) {
            // If the number of friends changed, notify the current user
            const delta = numFriendsAfter - numFriendsBefore;
            this.notifyFriendChanges(delta);
        }
    }

    /**
     * Notifies subscribers of a change in the friends list
     * @param delta The change in amount of friends in the party
     */
    private notifyFriendChanges(delta: number): void {
        this.hasNotifiedPartySize = true;
        for (const cb of this.friendChangeSubscribers) {
            cb(this.#friends.size, delta);
        }
    }

    /**
     * Method to handle when a peer connects to the current user if the current user is the host
     * @param conn The peer connection
     */
    private onPeerConnectToHost(conn: Peer.DataConnection): void {
        this.handleConnect(conn);

        // Wait to send messages until peer has finished setting up their connection
        setTimeout(() => {
            // Notify everyone in the party with the updated friendslist
            const currentUser: IFriend = { id: this.id!, displayName: this.displayName };
            // Include the current user is the friend message so peers include the host in their friend list
            const friends: IFriend[] = [currentUser];
            this.#friends.forEach(friend => {
                friends.push({ id: friend.id, displayName: friend.displayName });
            });

            const friendMessage: IFriendMessage = { messageType: MessageType.Friend, friends };
            this.#friends.forEach(friend => {
                friend.connection?.send(friendMessage);
            });
            const pollMessage: IPollMessage = { messageType: MessageType.Poll };
            this.#port.postMessage(pollMessage);
        }, 500);
    }

    /**
     * Releases managed resources
     */
    public destroy(): void {
        this.#peer.destroy();
        // Release callbacks to avoid memory leak
        this.friendChangeSubscribers = [];
    }
}
