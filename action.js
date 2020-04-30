// We monitor all `<iframe` and top-frame content for a `<video` tag, and store
// the frame info to be used when our chrome.browserAction is clicked.
let videoFrame;

function parseURL(url) {
    const tabURL = new URL(url);
    const hashComponents = tabURL.hash.replace(/^[#]/, '').split('?');
    const urlParams = new URLSearchParams(hashComponents[1]);

    return [ urlParams, tabURL, hashComponents ];
}

function updateURL(url, updateFn) {
    const [ urlParams, tabURL, hashComponents ] = parseURL(url);

    updateFn(urlParams);
    hashComponents[1] = urlParams.toString();
    tabURL.hash = hashComponents.join('?');

    return tabURL;
}

function onVideoDiscovered(frame) {
    videoFrame = frame;
    const [ urlParams ] = parseURL(frame.tab.url);

    const hostId = urlParams.get('watchparty');

    if (hostId) {
        chrome.tabs.sendMessage(frame.tab.id, {
            type: 'peerJoining',
            hostId
        }, { frameId: frame.frameId });
    }
}

function onHostConnected(frame, peerId) {
    const tabURL = updateURL(frame.tab.url, (urlParams) => {
        urlParams.set('watchparty', peerId);
    });

    chrome.tabs.executeScript(frame.tab.id, {
        code: `history.replaceState(null, null, ${JSON.stringify(`${tabURL.pathname}${tabURL.hash}`)});
navigator.clipboard.writeText(${JSON.stringify(tabURL.href)}).then(() => {
    alert('Watch Party URL is copied to clipboard. Share it with friends who have this plugin!');
}, (error) => {
    alert('Error writing to clipboard: ' + error.message);
});`
    });
}

function onSessionEnded(frame) {
    const tabURL = updateURL(frame.tab.url, (urlParams) => {
        urlParams.delete('watchparty');
    });

    chrome.tabs.executeScript(frame.tab.id, {
        code: `history.replaceState(null, null, ${JSON.stringify(`${tabURL.pathname}${tabURL.hash}`)});`
    });
}

chrome.browserAction.onClicked.addListener((tab) => {
    if (!videoFrame || tab.id !== videoFrame.tab.id) {
        chrome.tabs.executeScript(tab.id, {
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

        chrome.notifications.create({
            iconUrl: chrome.extension.getURL("logo.png"),
            type: 'basic',
            title: 'WatchParty',
            message: `Your host has left. You are watching independently.`
        })
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
