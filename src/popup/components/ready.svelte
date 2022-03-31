<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { parseURL } from "../../url";

  const dispatch = createEventDispatcher();

  export let joinId: string = '';
  let isPartyJoiner: boolean = false;

  function findSession() {
    isPartyJoiner = true;
  }
  function joinSession() {
    if (joinId.includes('://')) {
      const url = parseURL(joinId);
      joinId = url.urlParams.get('watchparty') || '';
    }

    if (joinId) {
        dispatch('join', joinId);
    }
  }
  function hostSession() {
    dispatch('host');
  }
</script>

<main class="option">
    <h2>Ready for the watch party?</h2>

    {#if !isPartyJoiner}
        <p>Let's do this!</p>

        <button class="block success" on:click={hostSession}>
            <svg class="icon">
                <use xlink:href="#icon-plus"></use>
            </svg>
            Create a watch party
        </button>

        <button class="block primary" on:click={findSession}>
            <svg class="icon">
                <use xlink:href="#icon-enter"></use>
            </svg>
            Join a watch party
        </button>
    {:else}
        <p>Enter the URL or party code shared by a friend.</p>

        <form on:submit={joinSession}>
            <label for="room">
                <span>Room:</span>
                <input placeholder="https://" bind:value={joinId} autofocus />
            </label>

            <button class="block primary" type="submit">
                <svg class="icon">
                    <use xlink:href="#icon-enter"></use>
                </svg>
                Join a watch party
            </button>
        </form>

    {/if}
</main>
