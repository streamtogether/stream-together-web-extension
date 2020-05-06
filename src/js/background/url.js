export function parseURL(url) {
    const tabURL = new URL(url);
    const hashComponents = tabURL.hash.replace(/^[#]/, "").split("?");
    const urlParams = new URLSearchParams(hashComponents[1]);

    return [urlParams, tabURL, hashComponents];
}

export function updateURL(url, updateFn) {
    const [urlParams, tabURL, hashComponents] = parseURL(url);

    updateFn(urlParams);
    hashComponents[1] = urlParams.toString();
    tabURL.hash = hashComponents.join("?");

    return tabURL;
}
