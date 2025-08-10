<script lang="ts">
  import { Heading } from "flowbite-svelte";
  import type { Snippet } from "svelte";

  const {
    rows = 1,
    cols = 1,
    highlightOnHover = false,
    title = undefined,
    slotTitleLeft,
    slotTitleRight,
    children,
  }: {
    rows?: number;
    cols?: number;
    highlightOnHover?: boolean;
    title?: string | null | undefined;
    slotTitleLeft?: Snippet;
    slotTitleRight?: Snippet;
    children?: Snippet;
  } = $props();
</script>

<div
  class="flex h-full w-full flex-col items-center gap-2 rounded-lg border border-gray-300 p-2 text-center text-gray-400 shadow-md"
  class:hover:border-gray-500={highlightOnHover}
  class:hover:shadow-lg={highlightOnHover}
  class:col-span-1={cols < 1 || cols > 6 || cols === 1}
  class:row-span-1={rows < 1 || rows > 6 || rows === 1}
  class:col-span-2={cols === 2}
  class:col-span-3={cols === 3}
  class:col-span-4={cols === 4}
  class:col-span-5={cols === 5}
  class:col-span-6={cols === 6}
  class:row-span-2={rows === 2}
  class:row-span-3={rows === 3}
  class:row-span-4={rows === 4}
  class:row-span-5={rows === 5}
  class:row-span-6={rows === 6}
>
  <div class="flex w-full flex-row justify-between self-center">
    {#if slotTitleLeft}{@render slotTitleLeft()}{/if}
    {#if title}
      <Heading class="text-left" tag="h4">{title}</Heading>
    {/if}
    {#if slotTitleRight}{@render slotTitleRight()}{/if}
  </div>
  {#if children}{@render children()}{/if}
</div>
