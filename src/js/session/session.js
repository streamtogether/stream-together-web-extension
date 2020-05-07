export function connect() {
    const video = document.querySelector("video");
    if (!video) {
        return;
    }

    const port = chrome.runtime.connect();

    function transmitEvent() {
        port.postMessage({
            type: "video",
            paused: video.paused,
            currentTime: video.currentTime
        });
    }

    function handleEvent(message) {
        if (message.type === "video") {
            if (Math.abs(video.currentTime - message.currentTime) > 0.25) {
                // Allow up to 250ms of time difference between plays
                video.currentTime = message.currentTime;
            }

            if (video.paused && !message.paused) {
                video.play();
            } else if (!video.paused && message.paused) {
                video.pause();
            }
        } else if (message.type === "poll") {
            transmitEvent();
        }
    }

    video.addEventListener("play", transmitEvent);
    video.addEventListener("pause", transmitEvent);
    video.addEventListener("seeked", transmitEvent);

    port.onMessage.addListener(handleEvent);

    port.onDisconnect.addListener(() => {
        video.removeEventListener("play", transmitEvent);
        video.removeEventListener("pause", transmitEvent);
        video.removeEventListener("seeked", transmitEvent);
    });
}
