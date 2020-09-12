import { Host, HostEvent } from "./host";
import { browser } from "webextension-polyfill-ts";
import Debug from "debug";

export const sessions = new Map<number, Host>();

browser.runtime.onConnect.addListener(async port => {
    const tab = await browser.tabs.query({ active: true, currentWindow: true });
    const tabId = tab[0].id || -1;
    const tabUrl = tab[0].url || "";

    const Log = Debug(`peer:tab${tabId}`);

    let host = sessions.get(tabId);

    if (!host) {
        Log(`Creating new Host session for tab ${tabId}`);

        host = new Host(tabUrl);
        sessions.set(tabId, host);

        if (port.name !== "session") {
            Log(`Activating video detector for tab ${tabId}`);

            await browser.tabs.executeScript(tabId, {
                file: "js/session.js",
                allFrames: true
            });
        }
    }

    if (port.name === "session") {
        // See https://www.reddit.com/r/typescript/comments/beafzw/how_do_i_leverage_type_inference_for_nested/
        const sessionHost = host;

        Log(`Connecting video detector of tab ${tabId}`);
        host.connect(port);

        host.addListener(HostEvent.FriendsChanged, function (count: number, delta: number): void {
            browser.browserAction.setBadgeText({
                text: `${count}`,
                tabId: tabId
            });

            browser.notifications.create({
                iconUrl: browser.extension.getURL("logo.png"),
                type: "basic",
                title: "Stream Together",
                message:
                    `${Math.abs(delta) === 1 ? "A" : Math.abs(delta)} friend has ${delta > 0 ? "joined" : "left"}. ` +
                    `You now have ${count} watching.`
            });
        });

        host.addListener(HostEvent.Connected, function (): void {
            if (!sessionHost.personalData) {
                return;
            }

            browser.browserAction.setBadgeText({
                text: "0",
                tabId: tabId
            });
        });

        port.onDisconnect.addListener(() => {
            Log(`Destroying Host of tab ${tabId}`);
            sessions.delete(tabId);
            sessionHost.destroy();

            browser.browserAction.setBadgeText({
                text: null,
                tabId: tabId
            });
        });
    } else {
        Log(`Connecting popup observer of tab ${tabId}`);

        host.observe(port);
    }
});
