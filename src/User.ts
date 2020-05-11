import Peer from "peerjs";
import { IUserPermissions } from "./Permissions";

export interface IUser {
    readonly id: string;
    readonly displayName: string;
    readonly permissions: IUserPermissions;
}

export interface IUserConnection extends IUser {
    // Connection can be undefined if it's the current user or if the user is still connecting to the session
    readonly connection?: Peer.DataConnection;
}
