import Peer from "peerjs";

export interface IFriend {
    readonly id: string;
    readonly displayName: string;
}

export interface IFriendConnection extends IFriend {
    readonly connection?: Peer.DataConnection;
}
