import Debug from "debug";
import Peer from "peerjs";
import { Friend, LocalOutMessage, LocalPollMessage, MessageType, RemoteMessage } from "../Message";

export interface FriendConnected extends Friend {
    conn: Peer.DataConnection;
}

export class Host {
    #log = Debug("peer:disconnected");
    #port: chrome.runtime.Port;
    #peer = new Peer();

    #friends = new Map<string, FriendConnected>();

    public personalData: Friend | null = null;
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    public onChangeFriends: (count: number, delta: number) => void = () => {};

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
                    ...friend
                });
            } else if (member.id === conn.peer) {
                // insert the person we connected to, now that we know their info
                this.#friends.set(conn.peer, {
                    ...member,
                    conn
                });
                this.onChangeFriends(this.#friends.size, 1);
            } else {
                // for new people, just go connect to them (& hopefully they aren't doing the same)
                this.connect(member.id);
            }
        }
    };

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
            const timer = Math.round(Math.random() * 1000);
            this.#log(`Received data from ${conn.peer} (will wait ${timer}ms for connections)`, data);

            this.#port.postMessage(data);
            setTimeout(() => this.#ensureConnections(data.friends, conn), timer);
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

    public connect(hostId: string): void {
        this.#log(`Opening new peer connection to ${hostId}`);

        const conn = this.#peer.connect(hostId, {
            metadata: this.personalData
        });

        conn.on("open", () => this.#handleConnect(conn, false));
    }

    public destroy(): void {
        this.#peer.destroy();
    }
}
