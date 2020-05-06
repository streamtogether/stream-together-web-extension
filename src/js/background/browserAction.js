import { sessions } from "./messenger.js";
import { updateURL, parseURL } from "./url.js";

chrome.browserAction.onClicked.addListener((tab) => {
  if (sessions.has(tab.id)) {
    alert("This tab is already in a session.");
    return;
  }

  const [urlParams] = parseURL(tab.url);
  const joinId = prompt("TBD: Host ID or blank:", urlParams.get("watchparty"));

  chrome.tabs.executeScript(tab.id, {
    file: "src/js-loaders/session.js",
    allFrames: true
  });

  (function next(i) {
    const host = sessions.get(tab.id);

    if (host && host.isReady) {
      chrome.browserAction.setBadgeText({
        text: "0",
        tabId: tab.id
      });

      host.onChangeFriends = (count, delta) => {
        chrome.browserAction.setBadgeText({
          text: `${count}`,
          tabId: tab.id
        });

        chrome.notifications.create({
          iconUrl: chrome.extension.getURL("logo.png"),
          type: "basic",
          title: "WatchParty",
          message: `${Math.abs(delta) === 1 ? "A" : Math.abs(delta)} friend has ${delta > 0 ? "joined" : "left"}. `
            + `You now have ${count} watching.`
        })
      }

      const shareURL = updateURL(tab.url, (urlParams) => {
        urlParams.set("watchparty", host.id);
      });

      chrome.tabs.executeScript(tab.id, {
        code: `history.replaceState(null, null, ${JSON.stringify(`${shareURL.pathname}${shareURL.hash}`)});`
      });

      if (joinId) {
        host.connect(joinId);
      } else {
        navigator.clipboard.writeText(shareURL.href)
          .then(() => alert("Video URL is copied to your clipboard. Share with friends " +
            "and have them click the extension to join!"))
          .catch((err) => alert(`Share the video URL below with friends:\n\n${shareURL.href}\n\n${err}`));

      }
    } else if (i < 10) {
      setTimeout(() => next(++i), 500);
    } else {
      alert("This tab does not have any compatible video");
    }
  })(0);
});
