<script lang="typescript">
  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();

  export let title: string = '';
  export let message: string = '';
  export let retryable: boolean = true;

  function retry() {
    dispatch('retry');
  }
</script>

<main class="tryagain">
    <svg class="icon">
        <use xlink:href="#icon-wondering"></use>
    </svg>
    <h3>{title}</h3>
    <p>{message}</p>
    {#if retryable}
        <button class="primary" on:click={retry}>
            <svg class="icon">
                <use xlink:href="#icon-retry"></use>
            </svg>
            Retry
        </button>
    {/if}
</main>
