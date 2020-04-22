export class Party {
    #peerId
    #video
    #lastEvent
    #sessions = [];

    #transmitEvent = () => {
        this.#sessions.forEach((session) => session.send({
            sender: this.#peerId,
            paused: this.#video.paused,
            currentTime: this.#video.currentTime
        }));
    }

    #receiveEvent = (data) => {
        if (Math.abs(this.#video.currentTime - data.currentTime) > 0.25) {
            // Allow up to 250ms of time difference between plays
            this.#video.currentTime = data.currentTime;
        }

        if (this.#video.paused && !data.paused) {
            this.#video.play();
        } else if (!this.#video.paused && data.paused) {
            this.#video.pause();
        }
    }

    constructor(video, peerId) {
        this.#video = video;
        this.#peerId = peerId;

        video.addEventListener('play', this.#transmitEvent);
        video.addEventListener('pause', this.#transmitEvent);
        video.addEventListener('seeked', this.#transmitEvent);
    }

    mergeSession(session, isHost = false) {
        this.#sessions.push(session);

        session.on('data', (data) => {
            if (data.sender === this.#peerId) {
                // Ignore messages from ourselves
                return;
            }

            this.#lastEvent = Date.now();
            this.#receiveEvent(data);
        });

        if (isHost) {
            // The host should immediately transmit their current state.
            setTimeout(() => this.#transmitEvent(), 1500);
        }
    }
}
