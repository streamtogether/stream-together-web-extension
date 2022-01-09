import Debug from "debug";
import Peer from "peerjs";
import * as SessionPort from "../SessionPort";
import { Friend, FriendConnected } from "../Friend";
import { Runtime } from "webextension-polyfill-ts";
import * as PopupPort from "../PopupPort";
import EventEmitter from "eventemitter3";
import { updateURL } from "../url";

export enum HostEvent {
    /** The tab has detected a compatible video */
    VideoDetected = "videoDetected",
    /** The user has selected to join or host a session */
    Connected = "connected",
    /** A member has joined or left the session */
    FriendsChanged = "friendsChanged"
}

export class Host extends EventEmitter {
    #log = Debug("peer:offline");

    /** If this tab has a video element */
    #hasVideo: boolean | null = null;
    /** Our connection to the browser tab, if a video is detected */
    #port: Runtime.Port | null = null;
    /** Our network connection for listening for joiners, if the user has chosen to host or join */
    #peer: Peer | null = null;
    /** The last error that occurred with our PeerJS session */
    #lastPeerError: Error | null = null;
    /** All the people in this party (except ourselves), and their metadata */
    #friends = new Map<string, FriendConnected>();
    /** Any popup or other observers watching this connection */
    #observers = new Set<Runtime.Port>();
    /** Metadata about ourselves, to share with others */
    public personalData: Friend | null = null;

    /**
     * Notify any popup or other observers of the current connection state
     */
    #notifyObservers = (): void => {
        let currentState = PopupPort.State.VideoIncompatible;
        if (!this.#port) {
            currentState = PopupPort.State.VideoSearching;
        } else if (!this.#hasVideo) {
            currentState = PopupPort.State.VideoIncompatible;
        } else if (!this.#peer) {
            currentState = PopupPort.State.ReadyToJoin;
        } else if (this.#lastPeerError) {
            currentState = PopupPort.State.ConnectionError;
        } else if (!this.personalData) {
            currentState = PopupPort.State.Connecting;
        } else {
            currentState = PopupPort.State.InSession;
        }

        const message: PopupPort.LocalStateMessage = {
            type: PopupPort.MessageType.State,
            state: currentState,
            hostId: this.personalData?.id || null,
            videoURL: this.videoURL,
            lastError: this.#lastPeerError
                ? {
                      type: (this.#lastPeerError as unknown as { type: string }).type,
                      message: this.#lastPeerError.message
                  }
                : null,
            friends: Array.from(this.#friends.values()).map(friend => ({
                ...friend,
                conn: undefined
            }))
        };

        this.#observers.forEach(port => {
            this.#log("Notifying observers of state", message);
            port.postMessage(message);
        });
    };

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
                this.emit(HostEvent.FriendsChanged, this.#friends.size, 1);
            } else if (member.id < this.personalData.id) {
                // connect to new peer if we're alphanumerically higher (this prevents double-connecting)
                this.join(member.id);
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
            this.emit(HostEvent.FriendsChanged, this.#friends.size, 1);
        }

        conn.on("data", (data: SessionPort.RemoteMessage) => {
            if (!this.personalData) {
                return;
            }
            // We need to randomize `#ensureConnections()` so that two peers don't try to connect to each other at
            // the exact same time (immediately upon receiving the message).
            this.#log(`Received data from ${conn.peer}`, data);

            this.#port?.postMessage(data);
            this.#ensureConnections(data.friends, conn);
        });

        conn.on("close", () => {
            this.#friends.delete(conn.peer);
            this.emit(HostEvent.FriendsChanged, this.#friends.size, -1);
        });
    };

    public constructor(
        /** The sharable URL of the video that can pre-populate a joinId */
        public videoURL: string
    ) {
        super();

        this.addListener(HostEvent.VideoDetected, this.#notifyObservers);
        this.addListener(HostEvent.Connected, this.#notifyObservers);
        this.addListener(HostEvent.FriendsChanged, this.#notifyObservers);
    }

    public connect(port: Runtime.Port): void {
        this.#port = port;

        port.onMessage.addListener((message: SessionPort.LocalOutMessage) => {
            if (message.type == SessionPort.MessageType.Video) {
                if (this.#hasVideo !== true) {
                    this.#hasVideo = true;
                    this.emit(HostEvent.VideoDetected);
                    this;
                }
                if (!this.personalData) {
                    return;
                }
                const data: SessionPort.RemoteMessage = {
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
                this.#friends.forEach(friend => friend.conn.send(data));
            } else {
                if (this.#hasVideo !== false) {
                    this.#hasVideo = false;
                    this.emit(HostEvent.VideoDetected);
                }
            }
        });

        port.postMessage({ type: SessionPort.MessageType.Poll });
    }

    /** Merge our party with another streamer */
    public join(hostId: string): void {
        if (!this.#peer) {
            return;
        }

        this.#log(`Opening new peer connection to ${hostId}`);

        const conn = this.#peer.connect(hostId, {
            metadata: this.personalData
        });

        conn.on("open", () => this.#handleConnect(conn, false));
    }

    public observe(port: Runtime.Port): void {
        this.#observers.add(port);

        this.#log("Adding new observer for Host session");

        port.onDisconnect.addListener(() => {
            this.#observers.delete(port);
        });

        port.onMessage.addListener((message: PopupPort.LocalOutMessage) => {
            if (message.type === PopupPort.MessageType.Reset) {
                this.#log("Resetting and retrying session");
                this.#peer?.destroy();
                this.#lastPeerError = null;
                this.#peer = null;
                this.personalData = null;
            } else if (message.type === PopupPort.MessageType.Start) {
                this.#log("Establishing PeerJS session");
                this.#peer = new Peer();

                this.#peer.on("open", (id: string) => {
                    this.#log = Debug(`peer:${id}`);
                    this.#log("Connected to broker server");
                    this.#lastPeerError = null;
                    this.personalData = {
                        id,
                        title: id,
                        muted: false
                    };

                    const shareURL = updateURL(this.videoURL, urlParams => {
                        urlParams.set("watchparty", id);
                    });

                    if (message.joinId) {
                        this.join(message.joinId);
                    }

                    this.videoURL = shareURL.toString();
                    this.emit(HostEvent.Connected);
                });

                this.#peer.on("error", (err: Error) => {
                    this.#lastPeerError = err;
                    this.#notifyObservers();
                });

                this.#peer.on("connection", (conn: Peer.DataConnection) => {
                    this.#handleConnect(conn, true);
                    // for incoming connections, poll our video and transmit the status
                    setTimeout(() => {
                        const message: SessionPort.LocalPollMessage = { type: SessionPort.MessageType.Poll };
                        this.#port?.postMessage(message);
                    }, 500);
                });
            }

            this.#notifyObservers();
        });

        // initial propagation
        this.#notifyObservers();
    }

    /** Disconnect from our party */
    public destroy(): void {
        this.removeAllListeners();
        this.#peer?.destroy();
    }
}
