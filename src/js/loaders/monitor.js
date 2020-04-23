(async () => {
    const src = chrome.extension.getURL('src/js/monitor.js');
    const contentScript = await import(src);
    await contentScript.monitor();
})();
