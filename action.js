chrome.browserAction.onClicked.addListener((tab) => {
    chrome.tabs.executeScript(tab.id, {
        file: 'src/js/host.js'
    });
});
