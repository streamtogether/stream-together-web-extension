<script lang="typescript">
    import { Friend } from "../../Friend";

    export let videoURL: string = '';
    export let friends: Friend[] = [];

    function copyVideoURL(event) {
      event.target.select();
    }
</script>

<main class="party">
    <div class="tabs">
        <input hidden name="tabs" type="radio" id="party" checked />
        <label for="party" class="tab-title">Info</label>
        <input hidden name="tabs" type="radio" id="people" />
        <label for="people" class="tab-title">People</label>
        <div class="panel party">
            <p>You're all synced up! Enjoy the movie.</p>

            <p>Invite your friends using the link below:</p>

            <form>
                <input id="room" class="room" on:click={copyVideoURL} bind:value={videoURL} />
            </form>
            <!-- <p>
              You're not currently synced up with the host. Click the button
              below to get back on track with the rest of the group.
            </p>
            <button class="danger block">
              <svg class="icon">
                <use xlink:href="#icon-clock"></use>
              </svg>
              Synchronize
            </button> -->
        </div>
        <div class="panel people">
            <p class="viewing">{friends.length} {friends.length === 1 ? 'person' : 'people'} here</p>
            <ul class="peeps">
                {#each friends as friend}
                    <li>
                        <span class="avatar">{friend.id[0]}</span>
                        {friend.id}
                        <span class="timestamp">synchronized</span>
                    </li>
                {/each}
            </ul>
        </div>
    </div>
</main>
