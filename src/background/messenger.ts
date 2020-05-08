import { Host } from "./host";

export const sessions = new Map<number, Host>();

chrome.runtime.onConnect.addListener(port => {
    const tabId = port.sender?.tab?.id || 0;
    const host = new Host(port);

    sessions.set(tabId, host);

    port.onDisconnect.addListener(() => {
        sessions.delete(tabId);
        host.destroy();
    });
});
