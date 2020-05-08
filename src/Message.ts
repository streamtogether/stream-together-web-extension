export enum MessageType {
    Video = "video",
    Poll = "poll"
}

export interface VideoMessage {
    type: MessageType.Video;
    currentTime: number;
    paused: boolean;
}

export interface PollMessage {
    type: MessageType.Poll;
}

export type Message = VideoMessage | PollMessage;
