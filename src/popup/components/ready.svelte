<script lang="typescript">
  import { createEventDispatcher } from "svelte";
  import { parseURL } from "../../url";

  const dispatch = createEventDispatcher();

  export let joinId: string = '';
  let isPartyJoiner: boolean = false;
  let isConnecting: boolean = false;

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
        isConnecting = true;
    }
  }
  function hostSession() {
    dispatch('host');
    isConnecting = true;
  }
</script>

{#if isConnecting}
    <main class="looking">
        <svg class="icon spinner">
            <use xlink:href="#icon-spinner"></use>
        </svg>
        {#if isPartyJoiner}
            <h3>Joining room...</h3>
        {:else}
            <h3>Creating room...</h3>
        {/if}
    </main>
{:else}
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
{/if}
