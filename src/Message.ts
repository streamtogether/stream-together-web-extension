import { IFriend } from "./Friend";

export enum MessageType {
    Video = "video",
    Poll = "poll",
    Friend = "friend"
}

export interface IVideoMessage {
    readonly messageType: MessageType.Video;
    readonly currentTime: number;
    readonly paused: boolean;
}

export interface IPollMessage {
    readonly messageType: MessageType.Poll;
}

export interface IFriendMessage {
    readonly messageType: MessageType.Friend;
    readonly friends: IFriend[];
}

export type Message = IVideoMessage | IPollMessage | IFriendMessage;
