import { sessions } from "./messenger.js";

chrome.browserAction.onClicked.addListener((tab) => {
  const joinId = prompt('TBD: Host ID or blank:');

  chrome.tabs.executeScript(tab.id, {
    file: 'src/js-loaders/session.js',
    allFrames: true
  });

  (function next(i) {
    const host = sessions.get(tab.id);

    if (host && host.isReady) {
      if (joinId) {
        host.connect(joinId);
      } else {
        console.log(host.id);
      }
    } else if (i < 10) {
      setTimeout(() => next(++i), 500);
    } else {
      alert('This tab does not have any compatible video');
    }
  })(0);
});
