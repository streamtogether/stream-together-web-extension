(async () => {
  const src = chrome.extension.getURL("src/js/session/session.js");
  const contentScript = await import(src);
  await contentScript.connect();
})();
