import "../lib/peerjs.min.js";

export class Host {
    #port;
    #peer = new Peer();
    #friends = new Set();

    isReady = false;
    id = null;
    onChangeFriends = () => {};

    #handleConnect = conn => {
        this.#friends.add(conn);
        this.onChangeFriends(this.#friends.size, 1);

        conn.on("data", data => {
            this.#port.postMessage(data);
        });

        conn.on("close", () => {
            this.#friends.delete(conn);
            this.onChangeFriends(this.#friends.size, -1);
        });
    };

    constructor(port) {
        this.#port = port;

        this.#peer.on("open", id => {
            this.isReady = true;
            this.id = id;
        });

        port.onMessage.addListener(message => {
            this.#friends.forEach(conn => conn.send(message));
        });

        this.#peer.on("connection", conn => {
            this.#handleConnect(conn);
            // for incoming connections, poll our video and transmit the status
            setTimeout(() => port.postMessage({ type: "poll" }), 500);
        });
    }

    connect(hostId) {
        const conn = this.#peer.connect(hostId);

        conn.on("open", () => this.#handleConnect(conn));
    }

    destroy() {
        this.#peer.destroy();
    }
}
