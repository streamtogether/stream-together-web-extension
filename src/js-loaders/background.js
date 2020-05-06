(async () => {
  const src = chrome.extension.getURL("src/js/background/background.js");
  const contentScript = await import(src);
  await contentScript.connect();
})();
