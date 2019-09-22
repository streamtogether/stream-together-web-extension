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
            case "update":
                party.notify('Connected', 'Connected to ' + data.sender)
                player.currentTime = data.currentTime;
                if (data.paused) {
                    $(player).trigger('pause');
                } else {
                    $(player).trigger('play');
                }
                break;
            case "play":
                $(player).trigger('play');
                party.notify('Resumed', data.sender + ' resumed the video.')
                break;
            case "pause":
                $(player).trigger('pause');
                party.notify('Paused', data.sender + ' paused the video.')
                break;
            case "seeked":
                player.currentTime = data.currentTime;
                const minutes = parseInt(data.currentTime / 60)
                const seconds = data.currentTime % 60;
                party.notify('Changed time', data.sender + ' moved to ' + minutes + ':' + seconds)
                break;
        }
        $("video").on('canplaythrough', registerEvents)
        setTimeout(registerEvents, 1000)
}

party.onClientConnect = () => {
    party.sendMessage({
        command: 'update',
        paused: player.paused,
        currentTime: player.currentTime
    })
    notify('Connected', id + ' is connected.')

}

registerEvents();