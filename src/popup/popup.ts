import Popup from "./popup.svelte";
import { browser } from "webextension-polyfill-ts";
import { LocalInMessage, LocalStartMessage, MessageType } from "../PopupPort";
import { parseURL } from "../url";

const popup = new Popup({
    target: document.body
});

const port = browser.runtime.connect(undefined, { name: "popup" });

popup.$on("join", event => {
    const message: LocalStartMessage = {
        type: MessageType.Start,
        joinId: event.detail
    };
    port.postMessage(message);
});

popup.$on("host", () => {
    const message: LocalStartMessage = {
        type: MessageType.Start,
        joinId: null
    };
    port.postMessage(message);
});

port.onMessage.addListener((event: LocalInMessage) => {
    if (event.type === MessageType.State) {
        const url = parseURL(event.videoURL);

        popup.$set({
            state: event.state,
            friends: event.friends,
            hostId: event.hostId,
            joinId: url.urlParams.get("watchparty"),
            videoURL: event.videoURL
        });
    }
});
