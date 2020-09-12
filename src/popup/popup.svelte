<script lang="typescript">
  import { State } from "../PopupPort";
  import { Friend } from "../Friend";

  import SVGs from "./components/svgs.svelte";
  import Searching from "./components/searching.svelte";
  import Ready from "./components/ready.svelte";
  import Session from "./components/session.svelte";
  import Incompatible from "./components/incompatible.svelte";

  export let state: State = State.VideoSearching;
  export let friends: Friend[] = [];
  export let videoURL: string = '';
  export let joinId: string = '';
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
        {:else if state === State.InSession}
            <Session
                friends={friends}
                videoURL={videoURL}
            />
        {:else if state === State.VideoIncompatible}
            <Incompatible />
        {/if}
    </section>
</div>
