import Peer from "peerjs";
import { IUser, IUserConnection } from "../User";
import { Message, MessageType, IStateSyncMessage } from "../Message";
import { ISessionState } from "../SessionState";

export enum ConnectionState {
    Disconnected = 0,
    ConnectingToPeer = 1,
    ConnectingToSession = 2,
    Connected = 3
}

export interface IConnectToPeerMetadata {
    readonly userDisplayName: string;
    readonly connectionState: ConnectionState;
}

export class StreamSessionManager {
    /** Whether or not the current Host instance is initialized */
    public isReady = false;

    /** The current id */
    public currentUserId: string | null = null;

    /** The current user's chosen displayName */
    public displayName = "";

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    public onUserCountChange: (count: number, delta: number, isSessionJoin: boolean) => void = () => {};

    /** The id used to initiate a session join */
    private connectToExistingSessionReferralId: string | null = null;

    /** See: https://developer.chrome.com/extensions/runtime#type-Port */
    private port: chrome.runtime.Port;

    /** The underlying peerjs Peer instance */
    private peer = new Peer();

    /** The container for all session state information */
    private sessionState: ISessionState = {
        leaderId: "",
        sessionJoinOrder: [],
        sessionUsers: new Map<string, IUserConnection>()
    };

    /** The current users connection state */
    private connectionState: ConnectionState = ConnectionState.Disconnected;

    public constructor(port: chrome.runtime.Port) {
        this.port = port;

        this.peer.on("open", (id: string) => {
            this.isReady = true;
            this.currentUserId = id;

            this.sessionState.sessionUsers.set(id, {
                id,
                displayName: "",
                permissions: {
                    canControlVideo: true
                }
            });

            console.warn("ctor - updated session state");
            console.warn(this.sessionState);
        });

        port.onMessage.addListener(message => {
            if (!this.currentUserId) {
                return;
            }

            const currentUser = this.sessionState.sessionUsers.get(this.currentUserId);
            if (currentUser?.permissions.canControlVideo) {
                this.sessionState.sessionUsers.forEach(user => {
                    if (user.id !== this.currentUserId) {
                        user.connection?.send(message);
                    }
                });
            }
        });

        this.peer.on("connection", (conn: Peer.DataConnection) => {
            this.onNewConnection(conn);
        });
    }

    /**
     * Initializes the state if the current user is leader of the current session
     */
    public initializeStateAsSessionStarter(): void {
        console.warn("Init as session starter");
        this.sessionState = {
            leaderId: this.currentUserId!,
            sessionJoinOrder: [this.currentUserId!],
            sessionUsers: this.sessionState.sessionUsers
        };
        console.warn(this.sessionState);
    }

    /**
     * Connects to a a peer. Can be used to start a session join if the current ConnectionState is Disconnected
     * @param peerId The id of the peer to initially connect to
     * @param [isReferral=false] Optional param that indicates that the peer we're connecting to is a referral
     */
    public connectToPeer(peerId: string, isReferral = false): void {
        if (isReferral) {
            this.connectionState = ConnectionState.ConnectingToPeer;
            this.connectToExistingSessionReferralId = peerId;
        }

        const connectionMetadata: IConnectToPeerMetadata = {
            // Todo - pass user display name (stored in localstorage?)
            userDisplayName: "",
            connectionState: this.connectionState
        };
        const conn = this.peer.connect(peerId, {
            metadata: connectionMetadata
        });

        conn.on("open", () => this.handleConnect(conn, ""));
    }

    /**
     * Releases managed resources
     */
    public destroy(): void {
        this.peer.destroy();
    }

    /**
     * Handle a new peer connection
     * @param conn The underlying data connection
     * @param userDisplayName The name of the user who initiated the connection
     */
    private handleConnect(conn: Peer.DataConnection, userDisplayName: string): void {
        // Add new connection to local users
        const user: IUserConnection = {
            id: conn.peer,
            displayName: userDisplayName,
            connection: conn,
            permissions: {
                canControlVideo: true
            }
        };
        this.sessionState.sessionUsers.set(user.id, user);

        conn.on("data", (data: Message) => {
            switch (data.messageType) {
                case MessageType.StateSync:
                    this.handleStateSyncMessage(data);
                    break;
                default:
                    break;
            }

            this.port.postMessage(data);
        });

        conn.on("close", () => {
            this.sessionState.sessionUsers.delete(user.id);
            this.sessionState.sessionJoinOrder.splice(this.sessionState.sessionJoinOrder.indexOf(user.id), 1);
            this.notifyUserCountChanges(-1, false);
            if (user.id === this.sessionState.leaderId) {
                const newLeaderId = this.determineNewLeaderId();
                this.sessionState = { ...this.sessionState, leaderId: newLeaderId };
                if (newLeaderId === this.currentUserId) {
                    // If the current user is the new leader, they should do a full sync after a processing wait
                    setTimeout(() => {
                        const syncStateMessage = this.generateSyncStateMessageFromCurrentState();
                        this.sessionState.sessionUsers.forEach(user => {
                            if (user.id !== this.currentUserId) {
                                user.connection?.send(syncStateMessage);
                            }
                        });
                    }, 500);
                }
            }
        });
    }

    /**
     * Determines the new leader id after the leader disconnects. Assumes the previous leader has been removed from sessionState
     */
    private determineNewLeaderId(): string {
        for (const userId of this.sessionState.sessionJoinOrder) {
            const user = this.sessionState.sessionUsers.get(userId);
            if (user?.permissions.canControlVideo) {
                return user.id;
            }
        }

        // If we haven't found any other users who can control video, default to the oldest in the join order
        return this.sessionState.sessionJoinOrder[0];
    }

    /**
     * Handler for state sync messages
     * @param message The state sync message to process
     */
    private handleStateSyncMessage(message: IStateSyncMessage): void {
        const numUsersBefore = this.sessionState.sessionUsers.size;
        // List of ids used for cleaning up users list after updates
        const newListIds: string[] = [];

        for (const user of message.state.sessionUsers) {
            const existingUser = this.sessionState.sessionUsers.get(user.id);
            const existingUserPeerJsConnection = existingUser?.connection;

            const newUserObj: IUserConnection = {
                id: user.id,
                displayName: user.displayName,
                connection: existingUserPeerJsConnection,
                permissions: user.permissions
            };
            this.sessionState.sessionUsers.set(user.id, newUserObj);
            newListIds.push(user.id);
        }

        // We've set the new users, but we need to clean up any users that weren't in the message
        this.sessionState.sessionUsers.forEach(user => {
            if (newListIds.indexOf(user.id) < 0) {
                // User entry wasn't in the list of users we got from the host
                this.sessionState.sessionUsers.delete(user.id);
            }
        });

        const numUsersAfter = this.sessionState.sessionUsers.size;
        // If we're not establishing the session connections, notify user changes
        // Otherwise, we'll handle the notification once we connect to session
        if (numUsersBefore !== numUsersAfter && this.connectionState !== ConnectionState.ConnectingToPeer) {
            // If the number of users changed, notify the current user
            const delta = numUsersAfter - numUsersBefore;

            this.notifyUserCountChanges(delta, false);
        }

        this.sessionState = {
            leaderId: message.state.leaderId,
            sessionJoinOrder: message.state.sessionJoinOrder,
            sessionUsers: this.sessionState.sessionUsers
        };

        if (this.connectionState === ConnectionState.ConnectingToPeer) {
            this.connectToSession();
        }
    }

    /**
     * Connects the current user to the session
     */
    private connectToSession(): void {
        if (this.connectionState !== ConnectionState.ConnectingToPeer) {
            // This method should only be called once we've received state info from our contact
            // This indicates a bug in our code
            console.error(`ConnectToSession called with invalid connection state: ${this.connectionState}`);
        }

        this.connectionState = ConnectionState.ConnectingToSession;

        this.sessionState.sessionUsers.forEach(user => {
            if (user.id !== this.connectToExistingSessionReferralId && user.id !== this.currentUserId) {
                this.connectToPeer(user.id);
            }
        });

        this.notifyUserCountChanges(this.sessionState.sessionUsers.size, true);
    }

    /**
     * Notifies subscribers of a change in the session users list
     * @param delta The change in amount of users in the party
     */
    private notifyUserCountChanges(delta: number, isSessionJoin: boolean): void {
        this.onUserCountChange(this.sessionState.sessionUsers.size, delta, isSessionJoin);
    }

    /**
     * Method to handle when a peer connects to the current user if the current user is the host
     * @param conn The peer connection
     */
    private onNewConnection(conn: Peer.DataConnection): void {
        console.warn("got new connection");
        console.warn(conn);
        // Push newly connected user to the end of the session join order
        this.sessionState.sessionJoinOrder.push(conn.peer);

        const connectionMetadata: IConnectToPeerMetadata = conn.metadata as IConnectToPeerMetadata;
        console.warn("connection md");
        console.warn(connectionMetadata);
        this.handleConnect(conn, connectionMetadata.userDisplayName);
        this.notifyUserCountChanges(1, false);

        if (connectionMetadata.connectionState === ConnectionState.ConnectingToPeer) {
            console.warn("IZ BABY");
            // We've received an initial request and need to provide the user with the current state so they can fully connect to the session
            // Current user will use this info to start connecting to all peers in the users list and init state
            // Once the connections have successfully been set up, the new user will request another state sync from the leader
            // Wait to send messages until peer has finished setting up their connection
            setTimeout(() => {
                const stateSyncMessage = this.generateSyncStateMessageFromCurrentState();
                console.warn("Sending state sync message to baby");
                console.warn(stateSyncMessage);
                conn.send(stateSyncMessage);
            }, 500);
        }
    }

    /**
     * Creates a state sync message from the current known state
     */
    private generateSyncStateMessageFromCurrentState(): IStateSyncMessage {
        // Include the current user is the user message so peers include the host in their user list
        const users: IUser[] = [...this.sessionState.sessionUsers.values()].map((user: IUserConnection) => ({
            id: user.id,
            displayName: user.displayName,
            permissions: user.permissions
        }));

        return {
            messageType: MessageType.StateSync,
            state: {
                leaderId: this.sessionState.leaderId,
                sessionUsers: users,
                sessionJoinOrder: this.sessionState.sessionJoinOrder
            }
        };
    }
}
