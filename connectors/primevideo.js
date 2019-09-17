const init = () => {

    var player = $("video")[0]

    var party = new WatchParty();
    // Set share URL
    party.shareUrl.searchParams.append('autoplay', 1);

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
        party.sendMessage({
            command: 'update',
            paused: player.paused,
            timeStamp: player.timeStamp
        })
    }

    registerEvents();

}

$(document).ready(function() {
    // Wait for video player to show up
    const check = setInterval(() => {
        console.log('Checking player');
        if (document.querySelector('.dv-player-fullscreen') !== null){
            console.log('Player found');
            console.log($(".dv-player-fullscreen"))
            clearInterval(check)
            init();
        }
    }, 500)
})
