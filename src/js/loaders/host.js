(async () => {
    const src = chrome.extension.getURL('src/js/host.js');
    const contentScript = await import(src);
    await contentScript.host();
})();
