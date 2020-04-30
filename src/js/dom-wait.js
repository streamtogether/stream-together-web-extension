export function waitForElement(selector) {
    return new Promise(function(resolve) {
        const interval = setInterval(() => {
            const element = document.querySelector(selector);

            if (element) {
                clearInterval(interval);
                resolve(element);
            }
        }, 2 * 1000);
    });
}
