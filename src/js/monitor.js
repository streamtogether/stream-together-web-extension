import { waitForElement } from "./lib/dom-wait.js";
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

                peer.on('open', () => {
                    const session = peer.connect(data.hostId);

                    const video = document.querySelector('video');
                    const party = new Party(video, peer);
                    party.mergeSession(session);
                });
            }
        });
    }
}
