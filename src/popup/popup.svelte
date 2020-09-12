<script lang="typescript">
  import { createEventDispatcher } from "svelte";
  import { State } from "../PopupPort";
  import { Friend } from "../Friend";

  const dispatch = createEventDispatcher();

  export let state: State = State.VideoSearching;
  export let hostId: string | null = null;
  export let friends: Friend[] = [];
  export let videoURL: string = '';
  export let joinId: string = '';

  function joinSession() {
    dispatch('join', joinId);
  }
  function hostSession() {
    dispatch('host');
  }
</script>

{#if state === State.VideoSearching}
    <p>Searching for video...</p>
{:else if state === State.ReadyToJoin}
    <input bind:value={joinId} />
    <button on:click={joinSession}>Join</button>
    <button on:click={hostSession}>Host</button>
{:else if state === State.InSession}
    <p>Enjoy, {hostId}!</p>
    <input bind:value={videoURL} />
    {#each friends as friend}
        <p>Friend: {friend.id}</p>
    {/each}
{:else if state === State.VideoIncompatible}
    <p>No video detected</p>
{/if}
