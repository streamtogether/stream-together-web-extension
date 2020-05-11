import Peer from "peerjs";
import { IUserPermissions } from "./Permissions";

export interface IUser {
    readonly id: string;
    readonly displayName: string;
    readonly permissions: IUserPermissions;
}

export interface IUserConnection extends IUser {
    readonly connection?: Peer.DataConnection;
}
