import { Friend } from "./Friend";

/** A type of message, both local and remote */
export enum MessageType {
    State = "state",
    Start = "start",
    Reset = "reset"
}

export enum State {
    VideoIncompatible = "videoIncompatible",
    VideoSearching = "videoSearching",
    ReadyToJoin = "readyToJoin",
    Connecting = "connecting",
    ConnectionError = "connectionError",
    InSession = "inSession"
}

/** The latest Host status */
export interface LocalStateMessage {
    type: MessageType.State;
    state: State;
    hostId: string | null;
    videoURL: string;
    lastError: {
        type: string;
        message: string;
    } | null;
    friends: Friend[];
}

/** Request to get the latest HTMLVideoElement status */
export interface LocalStartMessage {
    type: MessageType.Start;
    joinId: string | null;
}

/** Request to try again with a PeerJS sessionn */
export interface LocalResetMessage {
    type: MessageType.Reset;
}

/** Message sent to the tab frame from the background process */
export type LocalInMessage = LocalStateMessage;
/** Message sent to the background process from the tab frame */
export type LocalOutMessage = LocalStartMessage | LocalResetMessage;
