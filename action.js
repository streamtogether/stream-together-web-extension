chrome.browserAction.onClicked.addListener(() => {
    chrome.tabs.query({
        active: true,
        currentWindow: true
    }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {
            message: "host"
        });
    });
});