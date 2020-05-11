import { IUserConnection, IUser } from "./User";

interface IBaseSessionState {
    readonly leaderId: string;
    readonly sessionJoinOrder: string[];
}

export interface ISessionState extends IBaseSessionState {
    readonly sessionUsers: Map<string, IUserConnection>;
}

export interface ISerializableSessionState extends IBaseSessionState {
    readonly sessionUsers: IUser[];
}
