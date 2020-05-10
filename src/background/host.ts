import Peer from "peerjs";
import { Friend, IFriend } from "../Friend";
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
    #friends = new Map<string, Friend>();

    /** List of friend change subscribers */
    private friendChangeSubscribers: ((count: number, delta: number) => void)[] = [];

    public constructor(port: chrome.runtime.Port) {
        this.#port = port;

        this.#peer.on("open", (id: string) => {
            this.isReady = true;
            this.id = id;
        });

        port.onMessage.addListener(message => {
            console.warn("Got message from port. Sending to friends");
            console.warn(message);
            this.#friends.forEach(friend => friend.sendMessage(message));
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
        const friend: Friend = new Friend(conn.peer, undefined, conn);
        this.#friends.set(friend.id, friend);
        shouldNotify && this.notifyFriendChanges(1);

        conn.on("data", (data: Message) => {
            console.warn("got message from connection");
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
        console.warn("got friend message");
        console.warn(message);
        const numFriendsBefore = this.#friends.size;
        // List of ids used for cleaning up friends list after updates
        const newListIds: string[] = [];

        for (const messageFriend of message.friends) {
            const existingFriend = this.#friends.get(messageFriend.id);
            const existingFriendPeerJsConnection = existingFriend?.connection;

            // Message will contain the current user id
            if (messageFriend.id !== this.id) {
                console.warn(`Adding friend with id: ${messageFriend.id}`);
                const newFriendInstance = new Friend(messageFriend.id, messageFriend.displayName, existingFriendPeerJsConnection);
                this.#friends.set(messageFriend.id, newFriendInstance);
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
        // If the number of friends changed, notify the current user
        if (numFriendsBefore !== numFriendsAfter) {
            const delta = numFriendsAfter - numFriendsBefore;
            this.notifyFriendChanges(delta);
        }
    }

    /**
     * Notifies subscribers of a change in the friends list
     * @param delta The change in amount of friends in the party
     */
    private notifyFriendChanges(delta: number): void {
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

        // Notify everyone in the party with the updated friendslist
        if (this.id == null) {
            return;
        }

        const currentUser: IFriend = { id: this.id, displayName: this.displayName };
        const friends = [];
        this.#friends.forEach(friend => {
            friends.push(friend.toSerializable());
        });

        // Include the current user is the friend message so peers include the host in their friend list
        friends.push(currentUser);
        const friendMessage: IFriendMessage = { messageType: MessageType.Friend, friends };
        this.#friends.forEach(friend => {
            console.warn(`Sending message to: ${friend.id}`);
            console.warn(friendMessage);
            friend.sendMessage(friendMessage);
        });

        // For incoming connections, poll our video and transmit the status
        setTimeout(() => {
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
