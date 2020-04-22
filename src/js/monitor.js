(async () => {
    const src = chrome.extension.getURL('src/js/watchparty.js');
    const contentScript = await import(src);
    await contentScript.monitor();
})();
