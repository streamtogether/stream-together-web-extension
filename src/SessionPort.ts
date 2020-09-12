import { Friend } from "./Friend";

/** A type of message, both local and remote */
export enum MessageType {
    Video = "video",
    Poll = "poll"
}

/** The latest HTMLVideoElement status */
export interface LocalVideoMessage {
    type: MessageType.Video;
    currentTime: number;
    paused: boolean;
}

/** Request to get the latest HTMLVideoElement status */
export interface LocalPollMessage {
    type: MessageType.Poll;
}

/** Party metadata added to every network message */
export interface RemoteMessageExtensions {
    friends: Friend[];
}

/** Message sent to the tab frame from the background process */
export type LocalInMessage = LocalPollMessage | LocalVideoMessage;
/** Message sent to the background process from the tab frame */
export type LocalOutMessage = LocalVideoMessage;
/** Message sent to a peer from the background process */
export type RemoteMessage = LocalOutMessage & RemoteMessageExtensions;
