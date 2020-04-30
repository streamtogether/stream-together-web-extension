import { waitForElement } from "./dom-wait.js";
import { Party } from "./session.js";

export async function monitor() {
    const video = await waitForElement('video');

    if (video) {
        chrome.runtime.sendMessage({
            type: 'videoDiscovered'
        });

        chrome.runtime.onMessage.addListener(async (data) => {
            if (data.type === 'peerJoining') {
                await import('./lib/peerjs.min.js');

                const peer = new Peer();
                const party = new Party(video, peer);

                peer.on('open', () => {
                    const session = peer.connect(data.hostId);

                    session.on('open', () => party.mergeSession(session));
                    session.on('error', party.endSession);
                });

                peer.on('error', party.endSession)
            }
        });
    }
}
