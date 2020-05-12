export enum MessageType {
    Video = "video",
    Poll = "poll"
}

export interface Friend {
    id: string;
    muted: boolean;
    title: string;
}

export interface LocalVideoMessage {
    type: MessageType.Video;
    currentTime: number;
    paused: boolean;
}

export interface LocalPollMessage {
    type: MessageType.Poll;
}

export interface RemoteMessageExtensions {
    friends: Friend[];
}

// A local message is transmitted in/out of the tab frame
export type LocalInMessage = LocalPollMessage | LocalVideoMessage;
export type LocalOutMessage = LocalVideoMessage;
// A remote message is transmitted through PeerJS
export type RemoteMessage = LocalOutMessage & RemoteMessageExtensions;
