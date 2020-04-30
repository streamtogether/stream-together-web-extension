import { Party } from "./session.js";

export async function host() {
    const video = document.querySelector('video');

    if (!video) {
        alert('Unexpected host session with no video.');
        return;
    }

    await import('./lib/peerjs.min.js');

    const host = new Peer();
    const party = new Party(video, host);

    host.on('open', (id) => {
        chrome.runtime.sendMessage({
            type: 'hostConnected',
            peerId: id
        });

        host.on('connection', (session) => {
            party.mergeSession(session, true);
        });
    });

    host.on('error', party.endSession);
}
