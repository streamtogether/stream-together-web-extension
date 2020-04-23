export class Party {
    #peer
    #video
    #lastEvent = 0
    #sessions = [];

    #transmitEvent = () => {
        if (Date.now() - this.#lastEvent < 1000) { return; }
        this.#sessions.forEach((session) => session.send({
            sender: this.#peer.id,
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

    #endSession = (error) => {
        this.#sessions.forEach((session) => session.close());
        this.#peer.destroy();

        this.#video.removeEventListener('play', this.#transmitEvent);
        this.#video.removeEventListener('pause', this.#transmitEvent);
        this.#video.removeEventListener('seeked', this.#transmitEvent);

        chrome.runtime.sendMessage({
            type: 'sessionEnded',
            error
        })
    }

    #notifyDisconnect = (session) => {
        this.#sessions.splice(this.#sessions.indexOf(session), 1);

        chrome.runtime.sendMessage({
            type: 'peerDisconnected',
            peerCount: this.#sessions.length
        });
    }

    constructor(video, peer) {
        this.#video = video;
        this.#peer = peer;

        video.addEventListener('play', this.#transmitEvent);
        video.addEventListener('pause', this.#transmitEvent);
        video.addEventListener('seeked', this.#transmitEvent);
    }

    mergeSession(session, isHost = false) {
        this.#sessions.push(session);

        session.on('data', (data) => {
            if (data.sender === this.#peer.id) {
                // Ignore messages from ourselves
                return;
            }

            this.#lastEvent = Date.now();
            this.#receiveEvent(data);
        });

        session.on('error', this.#endSession)

        if (isHost) {
            // The host should immediately transmit their current state.
            setTimeout(() => this.#transmitEvent(), 1500);

            chrome.runtime.sendMessage({
                type: 'peerConnected',
                peerId: session.peer,
                peerCount: this.#sessions.length
            });

            session.on('close', () => this.#notifyDisconnect(session));
        } else {
            // Participants should remove the hash if their host leaves
            session.on('close', this.#endSession)
        }
    }
}
