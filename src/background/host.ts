import Debug from "debug";
import Peer from "peerjs";
import { LocalOutMessage, LocalPollMessage, MessageType, RemoteMessage } from "../Message";
import { Friend, FriendConnected } from "../Friend";

export class Host {
    #log = Debug("peer:disconnected");

    /** Our connection to the browser tab */
    #port: chrome.runtime.Port;
    /** Our network connection for listening for joiners */
    #peer = new Peer();
    /** All the people in this party (except ourselves), and their metadata */
    #friends = new Map<string, FriendConnected>();
    /** Metadata about ourselves, to share with others */
    public personalData: Friend | null = null;
    /** Event handler for updating the badge or showing notification */
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    public onChangeFriends: (count: number, delta: number) => void = () => {};

    /**
     * Ensures that all friends described by someone in this party are already part of our group.
     * @param friends The members someone else knows about.
     * @param conn The peer that emitted this friend set.
     */
    #ensureConnections = (friends: Friend[], conn: Peer.DataConnection): void => {
        if (!this.personalData) {
            return;
        }

        for (const member of friends) {
            const friend = this.#friends.get(member.id);

            if (member.id === this.personalData.id) {
                // do nothing regarding our own connection
            } else if (friend) {
                // update member data without touching `friend.conn`
                this.#friends.set(member.id, {
                    ...member,
                    conn: friend.conn
                });
            } else if (member.id === conn.peer) {
                // insert the person we connected to, now that we know their info
                this.#friends.set(conn.peer, {
                    ...member,
                    conn
                });
                this.onChangeFriends(this.#friends.size, 1);
            } else if (member.id < this.personalData.id) {
                // connect to new peer if we're alphanumerically higher (this prevents double-connecting)
                this.connect(member.id);
            }
        }
    };

    /**
     * Handle a new connection, both as incoming (where `metadata` will be their info), and
     * outgoing, where we need to learn of their metadata.
     * @param conn The peer that is a new connection.
     * @param isIncoming Whether `conn.metadata` will describe them or ourselves.
     */
    #handleConnect = (conn: Peer.DataConnection, isIncoming: boolean): void => {
        if (!this.personalData) {
            return;
        }

        this.#log(`Handling ${isIncoming ? "in" : "out"} connection`, conn.metadata);

        if (isIncoming) {
            // `conn.metadata` will always be the `Friend` of the **sender**, so when we handle the outgoing request,
            // we avoid writing ourselves as a friend (and therefore emitting events to ourselves & getting
            // infinite-looped).
            const friend: FriendConnected = {
                ...(conn.metadata as Friend),
                conn
            };

            this.#friends.set(conn.peer, friend);
            this.onChangeFriends(this.#friends.size, 1);
        }

        conn.on("data", (data: RemoteMessage) => {
            if (!this.personalData) {
                return;
            }
            // We need to randomize `#ensureConnections()` so that two peers don't try to connect to each other at
            // the exact same time (immediately upon receiving the message).
            this.#log(`Received data from ${conn.peer}`, data);

            this.#port.postMessage(data);
            this.#ensureConnections(data.friends, conn);
        });

        conn.on("close", () => {
            this.#friends.delete(conn.peer);
            this.onChangeFriends(this.#friends.size, -1);
        });
    };

    public constructor(port: chrome.runtime.Port) {
        this.#port = port;

        this.#peer.on("open", (id: string) => {
            this.#log = Debug(`peer:${id}`);
            this.#log("Connected to broker server");
            this.personalData = {
                id,
                title: id,
                muted: false
            };
        });

        port.onMessage.addListener((message: LocalOutMessage) => {
            if (!this.personalData) {
                return;
            }

            const data: RemoteMessage = {
                ...message,
                friends: [
                    this.personalData,
                    ...Array.from(this.#friends.values()).map(friend => ({
                        id: friend.id,
                        title: friend.title,
                        muted: friend.muted
                    }))
                ]
            };
            this.#log("Sending data", data);
            this.#friends.forEach(friend => friend.conn.send(data));
        });

        this.#peer.on("connection", (conn: Peer.DataConnection) => {
            this.#handleConnect(conn, true);
            // for incoming connections, poll our video and transmit the status
            setTimeout(() => {
                const message: LocalPollMessage = { type: MessageType.Poll };
                port.postMessage(message);
            }, 500);
        });
    }

    /** Merge our party with another streamer */
    public connect(hostId: string): void {
        this.#log(`Opening new peer connection to ${hostId}`);

        const conn = this.#peer.connect(hostId, {
            metadata: this.personalData
        });

        conn.on("open", () => this.#handleConnect(conn, false));
    }

    /** Disconnect from our party */
    public destroy(): void {
        this.#peer.destroy();
    }
}
