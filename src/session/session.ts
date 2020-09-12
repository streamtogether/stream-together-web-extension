import { LocalInMessage, LocalOutMessage, MessageType } from "../SessionPort";
import { browser } from "webextension-polyfill-ts";

function connect(video: HTMLVideoElement): void {
    const port = browser.runtime.connect(undefined, { name: "session" });

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

        // Don't re-add the listeners until this change is fully propagated (so we avoid
        // re-emitting an event to everyone when they're trying to handle the previous.
        setTimeout(addListeners, 15);
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

export function search(): void {
    (function next(i): void {
        const videoSearch = document.querySelector("video");
        if (videoSearch) {
            connect(videoSearch);
            return;
        }

        if (i < 20) {
            setTimeout(() => next(++i), 500);
        }
    })(0);
}

search();
