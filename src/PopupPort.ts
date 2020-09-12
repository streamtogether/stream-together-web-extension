import { Friend } from "./Friend";

/** A type of message, both local and remote */
export enum MessageType {
    State = "state",
    Start = "start"
}

export enum State {
    VideoIncompatible = "videoIncompatible",
    VideoSearching = "videoSearching",
    ReadyToJoin = "readyToJoin",
    InSession = "inSession"
}

/** The latest Host status */
export interface LocalStateMessage {
    type: MessageType.State;
    state: State;
    hostId: string | null;
    videoURL: string;
    friends: Friend[];
}

/** Request to get the latest HTMLVideoElement status */
export interface LocalStartMessage {
    type: MessageType.Start;
    joinId: string | null;
}

/** Message sent to the tab frame from the background process */
export type LocalInMessage = LocalStateMessage;
/** Message sent to the background process from the tab frame */
export type LocalOutMessage = LocalStartMessage;
