import { sessions } from "./messenger";
import { updateURL, parseURL } from "./url";

chrome.browserAction.onClicked.addListener(tab => {
    const tabId = tab.id || 0;
    const tabUrl = tab.url || "";

    if (sessions.has(tabId)) {
        alert("This tab is already in a session.");
        return;
    }

    const { urlParams } = parseURL(tabUrl);
    const joinId = prompt("TBD: Host ID or blank:", urlParams.get("streamparty") || "");

    chrome.tabs.executeScript(tabId, {
        file: "js/session.js",
        allFrames: true
    });

    (function next(i): void {
        const session = sessions.get(tabId);

        if (session && session.isReady && session.currentUserId) {
            const userId = session.currentUserId;

            chrome.browserAction.setBadgeText({
                text: "0",
                tabId: tab.id
            });

            session.onUserCountChange = (count, delta, isSessionJoin): void => {
                chrome.browserAction.setBadgeText({
                    text: `${count}`,
                    tabId: tab.id
                });

                let message: string;
                if (isSessionJoin) {
                    message = `You have joined a party of ${count}!`;
                } else {
                    message =
                        `${Math.abs(delta) === 1 ? "A" : Math.abs(delta)} friend has ${delta > 0 ? "joined" : "left"}. ` +
                        `You now have ${count} in the party.`;
                }

                chrome.notifications.create({
                    iconUrl: chrome.extension.getURL("logo.png"),
                    type: "basic",
                    title: "Stream Party",
                    message
                });
            };

            const shareURL = updateURL(tabUrl, urlParams => {
                urlParams.set("streamparty", userId);
            });

            chrome.tabs.executeScript(tabId, {
                code: `history.replaceState(null, null, ${JSON.stringify(`${shareURL.href}`)});`
            });

            if (joinId) {
                session.connectToPeer(joinId, true);
            } else {
                session.initializeStateAsSessionStarter();
                navigator.clipboard
                    .writeText(shareURL.href)
                    .then(() =>
                        alert("Video URL is copied to your clipboard. Share with friends and have them click the extension to join!")
                    )
                    .catch(err => alert(`Share the video URL below with friends:\n\n${shareURL.href}\n\n${err}`));
            }
        } else if (i < 10) {
            setTimeout(() => next(++i), 500);
        } else {
            alert("This tab does not have any compatible video");
        }
    })(0);
});
