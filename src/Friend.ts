import Peer from "peerjs";

/** Metadata regarding a member of the party */
export interface Friend {
    id: string;
    muted: boolean;
    title: string;
    joinedAt: string;
}

/** An active connection to a known member of the party */
export interface FriendConnected extends Friend {
    conn: Peer.DataConnection;
}
