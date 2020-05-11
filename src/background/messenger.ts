import { StreamSessionManager } from "./StreamSessionManager";

export const sessions = new Map<number, StreamSessionManager>();

chrome.runtime.onConnect.addListener(port => {
    const tabId = port.sender?.tab?.id || 0;
    const sessionManager = new StreamSessionManager(port);

    sessions.set(tabId, sessionManager);

    port.onDisconnect.addListener(() => {
        sessions.delete(tabId);
        sessionManager.destroy();
    });
});
