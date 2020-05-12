import { LocalInMessage, LocalOutMessage, MessageType } from "../Message";

export function connect(): void {
    const videoSearch = document.querySelector("video");
    if (!videoSearch) {
        return;
    }

    // See https://www.reddit.com/r/typescript/comments/beafzw/how_do_i_leverage_type_inference_for_nested/
    const video = videoSearch;
    const port = chrome.runtime.connect();

    function transmitEvent(): void {
        const message: LocalOutMessage = {
            type: MessageType.Video,
            paused: video.paused,
            currentTime: video.currentTime
        };
        port.postMessage(message);
    }

    /* eslint-disable @typescript-eslint/no-use-before-define */
    function handleEvent(message: LocalInMessage): void {
        clearListeners();

        if (message.type === MessageType.Video) {
            if (Math.abs(video.currentTime - message.currentTime) > 0.25) {
                // Allow up to 250ms of time difference between plays
                video.currentTime = message.currentTime;
            }

            if (video.paused && !message.paused) {
                video.play();
            } else if (!video.paused && message.paused) {
                video.pause();
            }
        } else if (message.type === MessageType.Poll) {
            transmitEvent();
        }

        addListeners();
    }
    /* eslint-enable @typescript-eslint/no-use-before-define */

    function addListeners(): void {
        video.addEventListener("play", transmitEvent);
        video.addEventListener("pause", transmitEvent);
        video.addEventListener("seeked", transmitEvent);
    }

    function clearListeners(): void {
        video.removeEventListener("play", transmitEvent);
        video.removeEventListener("pause", transmitEvent);
        video.removeEventListener("seeked", transmitEvent);
    }

    addListeners();
    port.onMessage.addListener(handleEvent);
    port.onDisconnect.addListener(() => {
        clearListeners();
    });
}

connect();
