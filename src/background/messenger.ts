import { Host } from "./host";
import { browser } from "webextension-polyfill-ts";

export const sessions = new Map<number, Host>();

browser.runtime.onConnect.addListener(port => {
    const tabId = port.sender?.tab?.id || 0;
    const host = new Host(port);

    sessions.set(tabId, host);

    port.onDisconnect.addListener(() => {
        sessions.delete(tabId);
        host.destroy();
    });
});
