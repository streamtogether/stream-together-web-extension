import { Party } from "./session.js";

export async function host() {
    const video = document.querySelector('video');
    if (!video) {
        alert('There are no videos to monitor on this page');
        return;
    }

    await import('./lib/peerjs.min.js');

    const host = new Peer();

    host.on('open', (id) => {
        const urlParams = window.location.hash.indexOf('?') !== -1
            ? new URLSearchParams(window.location.hash.split('?')[1])
            : new URLSearchParams(window.location.hash.substr(1));
        urlParams.set('watchparty', id);
        const shareUrl = new URL(window.location.href);
        shareUrl.hash = window.location.hash.indexOf('?') !== -1
            ? `${window.location.hash.substr(1).split('?')[0]}?${urlParams.toString()}`
            : urlParams.toString();

        navigator.clipboard.writeText(shareUrl.href).then(function () {
            alert('Watch Party URL is copied to clipboard. Share it with friends who have this plugin!');
        }, function (error) {
            alert(`Error writing to clipboard ${error.message}`);
        });

        const party = new Party(video, id);
        host.on('connection', (session) => {
            party.mergeSession(session, true);
        });
    });
}

export async function monitor() {
    const urlParams = window.location.hash.indexOf('?') !== -1
        ? new URLSearchParams(window.location.hash.split('?')[1])
        : new URLSearchParams(window.location.hash.substr(1));
    const peerId = urlParams.get('watchparty');

    if (peerId !== null) {
        await import('./lib/peerjs.min.js');

        const peer = new Peer();

        peer.on('open', (id) => {
            const session = peer.connect(peerId);

            const video = document.querySelector('video');
            const party = new Party(video, id);
            party.mergeSession(session);
        });
    }
}
