// See https://gist.github.com/PaulKinlan/2d7cd4e78a63a97387137a0a9fb7ee6e
export function waitForElement(selector) {
    return new Promise(function(resolve) {
        const element = document.querySelector(selector);

        if (element) {
            resolve(element);
            return;
        }

        const observer = new MutationObserver(() => {
            const element = document.querySelector(selector);

            if (element) {
                observer.disconnect();
                resolve(element);
            }
        });

        observer.observe(document.documentElement, { childList: true, subtree: true });
    });
}
