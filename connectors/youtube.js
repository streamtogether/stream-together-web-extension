var player = $("video")[0]

var party = new WatchParty();

var registerEvents = () => {
    $("video").off();
    $("video")
        .on("play", (e) => {
            party.sendMessage({
                command: 'play'
            })
        })
        .on("pause", (e) => {
            party.sendMessage({
                command: 'pause'
            })
        })
        .on("seeked", (e) => {
            party.sendMessage({
                command: 'seeked',
                currentTime: player.currentTime
            })
        })
}

party.onReceive = (data) => {
    $("video").off();
    switch (data.command) {
        case "hello":
            // Send back current info
            party.sendMessage({
                command: 'update',
                paused: player.paused,
                timeStamp: player.timeStamp
            })
            break;
        case "update":
            player.currentTime = data.currentTime;
            if (data.paused) {
                $(player).trigger('pause');
            } else {
                $(player).trigger('play');
            }
            break;
        case "play":
            $(player).trigger('play');
            break;
        case "pause":
            $(player).trigger('pause');
            break;
        case "seeked":
            player.currentTime = data.currentTime;
            break;
    }
    $("video").on('canplaythrough', registerEvents)
    setTimeout(registerEvents, 1000)
}

party.onClientConnect = () => {
    party.sendMessage({ command: 'hello' })
}

registerEvents();