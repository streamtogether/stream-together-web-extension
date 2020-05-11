import { Message, MessageType, IVideoMessage } from "../Message";

export function connect(): void {
    const videoSearch = document.querySelector("video");
    if (!videoSearch) {
        return;
    }

    // See https://www.reddit.com/r/typescript/comments/beafzw/how_do_i_leverage_type_inference_for_nested/
    const video = videoSearch;
    const port = chrome.runtime.connect();

    function transmitEvent(): void {
        const videoMessage: IVideoMessage = {
            messageType: MessageType.Video,
            paused: video.paused,
            currentTime: video.currentTime
        };

        port.postMessage(videoMessage);
    }

    function addEventListeners(): void {
        video.addEventListener("play", transmitEvent);
        video.addEventListener("pause", transmitEvent);
        video.addEventListener("seeked", transmitEvent);
    }

    function removeEventListeners(): void {
        video.removeEventListener("play", transmitEvent);
        video.removeEventListener("pause", transmitEvent);
        video.removeEventListener("seeked", transmitEvent);
    }

    function handleEvent(message: Message): void {
        console.warn("Port received message");
        console.warn(message);
        switch (message.messageType) {
            case MessageType.Video:
                removeEventListeners();
                if (Math.abs(video.currentTime - message.currentTime) > 0.25) {
                    // Allow up to 250ms of time difference between plays
                    video.currentTime = message.currentTime;
                }

                if (video.paused && !message.paused) {
                    video.play();
                } else if (!video.paused && message.paused) {
                    video.pause();
                }

                addEventListeners();
                break;
            case MessageType.Poll:
                console.warn("Calling transmit from poll");
                transmitEvent();
                break;
            default:
                break;
        }
    }

    addEventListeners();

    port.onMessage.addListener(handleEvent);

    port.onDisconnect.addListener(() => {
        removeEventListeners();
    });
}

connect();
