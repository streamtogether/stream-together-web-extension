import Peer from "peerjs";
import { Message } from "./Message";

export interface IFriend {
    readonly id: string;
    readonly displayName: string;
}

export class Friend {
    /** The friend id */
    public readonly id: string;
    public readonly displayName: string = "";
    public connection: Peer.DataConnection | undefined;

    constructor(id: string, displayName?: string, connection?: Peer.DataConnection) {
        this.id = id;
        if (displayName) {
            this.displayName = displayName;
        }

        if (connection) {
            this.connection = connection;
        }
    }

    /**
     * Set the DataConnection instance for this friend
     * @param conn The connection to set for this friend
     */
    public setConnection(conn: Peer.DataConnection): void {
        this.connection = conn;
    }

    /**
     * Send a message to this friend if there is a connection
     * @param message The message to send
     */
    public sendMessage(message: Message): void {
        this.connection?.send(message);
    }

    /**
     * Creates a serializable representation of the current instance
     */
    public toSerializable(): IFriend {
        return { id: this.id, displayName: this.displayName };
    }

    /**
     * Creates a new Friend instance from a serialized object
     */
    public fromSerializable(friendObject: IFriend): Friend {
        return new Friend(friendObject.id, friendObject.displayName);
    }
}
