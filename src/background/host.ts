import Peer from "peerjs";
import { Message, MessageType } from "../Message";

export class Host {
    #port: chrome.runtime.Port;
    #peer = new Peer();
    #friends = new Set<Peer.DataConnection>();

    public isReady = false;
    public id: string | null = null;
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    public onChangeFriends: (count: number, delta: number) => void = () => {};

    #handleConnect = (conn: Peer.DataConnection): void => {
        this.#friends.add(conn);
        this.onChangeFriends(this.#friends.size, 1);

        conn.on("data", (data: Message) => {
            this.#port.postMessage(data);
        });

        conn.on("close", () => {
            this.#friends.delete(conn);
            this.onChangeFriends(this.#friends.size, -1);
        });
    };

    public constructor(port: chrome.runtime.Port) {
        this.#port = port;

        this.#peer.on("open", (id: string) => {
            this.isReady = true;
            this.id = id;
        });

        port.onMessage.addListener(message => {
            this.#friends.forEach(conn => conn.send(message));
        });

        this.#peer.on("connection", (conn: Peer.DataConnection) => {
            this.#handleConnect(conn);
            // for incoming connections, poll our video and transmit the status
            setTimeout(() => port.postMessage({ type: MessageType.Poll }), 500);
        });
    }

    public connect(hostId: string): void {
        const conn = this.#peer.connect(hostId);

        conn.on("open", () => this.#handleConnect(conn));
    }

    public destroy(): void {
        this.#peer.destroy();
    }
}
