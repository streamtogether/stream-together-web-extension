class WatchParty extends Peer {

    connectionsArray = []
    onClientConnect;
    onReceive;

    constructor() {
        super();
        this.status = 0 // Statuses: 0 = waiting, 1 = client, 2 = server
        console.log("Watch party loaded.");
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            this.host();
        });
        this.detectPeerId();
    }

    connectionInit() {
        this.on('open', function (id) {
            console.log('WatchParty is ready. Peer ID: ', id);
        })
        this.on('disconnected', function () {
            console.log('Lost connection to PeerServer...');
        })
        this.on('error', function (err) {
            console.log(err);
            console.log(err.type);
        })
    }

    detectPeerId() {
        const peerId = new URL(window.location.href).searchParams.get('watchParty');
        if (peerId !== null) {
            this.connectionInit();
            this.join(peerId);
        }
    }

    host() {
        this.status = 2;
        this.connectionInit();

        const shareUrl = new URL(window.location.href);
        shareUrl.searchParams.append('watchParty', this.id);    

        navigator.permissions.query({
            name: "clipboard-write"
        }).then(result => {
            if (result.state == "granted" || result.state == "prompt") {
                navigator.clipboard.writeText(shareUrl.href).then(function () {
                    alert('URL has been copied to your clipboard. Share with anyone !');
                }, function (error) {
                    alert('Error while trying to access clipboard. URL has been pasted in console.');
                    console.log(error);
                });
            }
        });

        console.log('Share URL: ', shareUrl.href)

        this.on('connection', (conn) => {
            this.handleConnection(conn);
        });
    }

    join(peerId) {
        this.status = 1;
        var conn = this.connect(peerId);
        this.handleConnection(conn);
    }

    parsing = false;
    handleConnection(conn) {
        console.log('Handling connection...')
        this.connectionsArray.push(conn);

        // Todo settimeout check connected...
        conn.on('open', () => {
            console.log('Connected.');
            if (this.status === 1){
                this.onClientConnect(); // Ask for updates, eventually
            }
            conn.on('data', (data) => {
                console.log('Received', data);
                if (data.sender !== this.id) {

                    this.parsing = true; // Prevent loop
                    this.onReceive(data);
                    this.parsing = false;

                    if (this.status === 2) { // If hosting, replay to everyone
                        this.sendMessage(data);
                    }
                }
            });
        });
    }

    sendMessage(data) {
        // This prevents the sender to replay his own message
        data.sender = data.sender ? data.sender : this.id

        if (!this.parsing) {
            for (var i = 0; i < this.connectionsArray.length; i++) {
                var connection = this.connectionsArray[i]
                console.log('Sending... ', data);
                connection.send(data);
            }
        }
    }
}