<script lang="ts">
  import type { Snippet } from "svelte";

  const {
    showLayout,
    href,
    highlight = false,
    class: className = undefined,
    children,
  }: {
    showLayout: boolean;
    href?: string;
    highlight?: boolean;
    class?: string;
    children: Snippet;
  } = $props();
</script>

{#if href}
  <a
    {href}
    class="min-h-2 min-w-2 {className}"
    class:bg-gray-100={highlight}
    class:border={showLayout}
    class:hover:bg-gray-200={showLayout}
    class:hover:shadow-xl={showLayout}
    data-sveltekit-noscroll
  >
    {@render children()}
  </a>
{:else}
  <div
    class="min-h-2 min-w-2 {className}"
    class:bg-gray-100={highlight}
    class:border={showLayout}
    class:hover:bg-gray-200={showLayout}
    class:hover:shadow-xl={showLayout}
  >
    {@render children()}
  </div>
{/if}
