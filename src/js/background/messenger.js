import { Host } from "./host.js";

export const sessions = new Map();

chrome.runtime.onConnect.addListener(port => {
    const host = new Host(port);

    sessions.set(port.sender.tab.id, host);

    port.onDisconnect.addListener(() => {
        sessions.delete(port.sender.tab.id);
        host.destroy();
    });
});
