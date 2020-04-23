// We monitor all `<iframe` and top-frame content for a `<video` tag, and store
// the frame info to be used when our chrome.browserAction is clicked.
let videoFrame;

function _parseTabURL(url) {
    const tabURL = new URL(url);
    const hashComponents = tabURL.hash.replace(/^[#]/, '').split('?');
    const urlParams = new URLSearchParams(hashComponents.pop());
    const hash = hashComponents.join('?'); // all hash components except ours

    return [ urlParams, tabURL, hash ];
}

function onVideoDiscovered(frame) {
    videoFrame = frame;
    const [ urlParams ] = _parseTabURL(frame.tab.url);

    const hostId = urlParams.get('watchparty');

    if (hostId) {
        chrome.tabs.sendMessage(frame.tab.id, {
            type: 'peerJoining',
            hostId
        }, { frameId: frame.frameId });
    }
}

function onHostConnected(frame, peerId) {
    const [ urlParams, tabURL, hashComponents ] = _parseTabURL(frame.tab.url);

    urlParams.set('watchparty', peerId);

    const nextHash = `${hashComponents.join('?')}?${urlParams.toString()}`
        .replace(/^[?]/, '');

    tabURL.hash = nextHash;
    chrome.tabs.executeScript(frame.tab.id, {
        code: `window.location.hash = ${JSON.stringify(nextHash)}
navigator.clipboard.writeText(${JSON.stringify(tabURL.href)}).then(() => {
    alert('Watch Party URL is copied to clipboard. Share it with friends who have this plugin!');
}, (error) => {
    alert('Error writing to clipboard: ' + error.message);
});`
    });
}

function onSessionEnded(frame) {
    const [ urlParams, tabURL, hash ] = _parseTabURL(frame.tab.url);

    urlParams.delete('watchparty');

    const nextHash = `${hash}?${urlParams.toString()}`
        .replace(/^[?]/, '');

    tabURL.hash = nextHash;
    chrome.tabs.executeScript(frame.tab.id, {
        code: `window.location.hash = ${JSON.stringify(nextHash)}`
    });
}

chrome.browserAction.onClicked.addListener((tab) => {
    if (!videoFrame) {
        chrome.tabs.executeScript(frame.tab.id, {
            code: `alert('Video is not detected or not compatible with WatchParty.')`
        });
    } else {
        chrome.tabs.executeScript(tab.id, {
            file: 'src/js/loaders/host.js',
            frameId: videoFrame.frameId
        });
    }
});

chrome.runtime.onMessage.addListener((data, frame) => {
    if (data.type === 'videoDiscovered') {
        onVideoDiscovered(frame)
    } else if (data.type === 'hostConnected') {
        onHostConnected(frame, data.peerId);
    } else if (data.type === 'sessionEnded') {
        onSessionEnded(frame);
    } else if (data.type === 'peerConnected') {
        chrome.notifications.create({
            iconUrl: chrome.extension.getURL("logo.png"),
            type: 'basic',
            title: 'WatchParty',
            message: `Friend has joined. You now have ${data.peerCount} watching.`
        })
    } else if (data.type === 'peerDisconnected') {
        chrome.notifications.create({
            iconUrl: chrome.extension.getURL("logo.png"),
            type: 'basic',
            title: 'WatchParty',
            message: `Friend has left. You now have ${data.peerCount} watching.`
        })
    }
});
