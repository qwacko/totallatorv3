<script lang="ts">
  import { type AnchorProps, Button } from "flowbite-svelte";
  import type { Snippet } from "svelte";

  import { routeStore } from "$lib/prevPageStore";

  const {
    routeBased = false,
    children,
    ...restProps
  }: {
    routeBased?: boolean;
    children?: Snippet;
  } & AnchorProps = $props();
</script>

{#if routeBased}
  <Button href={$routeStore.prevRouteURL} {...restProps}>
    {#if children}
      {@render children()}
    {:else}
      Cancel
    {/if}
  </Button>
{:else}
  <Button onclick={() => window.history.back()} {...restProps}>
    {#if children}
      {@render children()}
    {:else}
      Cancel
    {/if}
  </Button>
{/if}
