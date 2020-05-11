import { ISerializableSessionState } from "./SessionState";

export enum MessageType {
    Video = "video",
    Poll = "poll",
    StateSync = "statesync"
}

export interface IVideoMessage {
    readonly messageType: MessageType.Video;
    readonly currentTime: number;
    readonly paused: boolean;
}

export interface IPollMessage {
    readonly messageType: MessageType.Poll;
}

export interface IStateSyncMessage {
    readonly messageType: MessageType.StateSync;
    readonly state: ISerializableSessionState;
}

export type Message = IVideoMessage | IPollMessage | IStateSyncMessage;
