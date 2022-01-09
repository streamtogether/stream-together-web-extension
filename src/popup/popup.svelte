<script lang="ts">
  import { LocalStateMessage, State } from "../PopupPort";
  import { Friend } from "../Friend";

  import SVGs from "./components/svgs.svelte";
  import Searching from "./components/searching.svelte";
  import Connecting from "./components/connecting.svelte";
  import Error from "./components/error.svelte";
  import Ready from "./components/ready.svelte";
  import Session from "./components/session.svelte";

  export let state: State = State.VideoSearching;
  export let friends: Friend[] = [];
  export let videoURL: string = '';
  export let joinId: string = '';
  export let lastError: LocalStateMessage['lastError'] = null;
</script>

<SVGs />
<div class="popup">
    <section class="page">
        <header>
            <h1>
                <svg class="icon"><use xlink:href="#icon-users"></use></svg>
                Stream Together
            </h1>
        </header>

        {#if state === State.VideoSearching}
            <Searching />
        {:else if state === State.ReadyToJoin}
            <Ready joinId={joinId}  on:join on:host />
        {:else if state === State.Connecting}
            <Connecting />
        {:else if state === State.ConnectionError && lastError !== null}
            <Error
                title={`Uh oh, ${lastError.type}`}
                message={lastError.message}
                on:retry
            />
        {:else if state === State.InSession}
            <Session
                friends={friends}
                videoURL={videoURL}
            />
        {:else if state === State.VideoIncompatible}
            <Error
                title="Uh oh!"
                message="This site doesn't seem to be compatible with this extension."
                retryable={false}
            />
        {/if}
    </section>
</div>
