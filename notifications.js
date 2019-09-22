chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.command === 'notify') {
        chrome.notifications.create('watchparty', request.options)
    }
}) 