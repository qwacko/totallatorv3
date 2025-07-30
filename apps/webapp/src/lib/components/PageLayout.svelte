<script lang="ts">
  import { Heading } from "flowbite-svelte";
  import type { Snippet } from "svelte";

  import type { PageSizeIds } from "@totallator/shared";

  import ArrowLeftIcon from "./icons/ArrowLeftIcon.svelte";
  import PrevPageButton from "./PrevPageButton.svelte";

  const {
    title,
    subtitle,
    size = "lg",
    hideBackButton = false,
    routeBasedBack = false,
    class: className = "",
    children,
    slotLeft,
    slotRight,
  }: {
    title?: string;
    subtitle?: string;
    size?: PageSizeIds;
    hideBackButton?: boolean;
    routeBasedBack?: boolean;
    class?: string;
    children?: Snippet;
    slotLeft?: Snippet;
    slotRight?: Snippet;
  } = $props();
</script>

<div class="mb-10 flex w-full justify-center px-4 {className}">
  <div
    class="flex w-full flex-col items-stretch gap-4"
    class:max-w-4xl={size === "lg"}
    class:max-w-xl={size === "sm"}
    class:max-w-xs={size === "xs"}
  >
    <div class="flex flex-row gap-2">
      <div class="flex grow basis-0">
        {#if slotLeft}{@render slotLeft()}{:else if !hideBackButton}
          <PrevPageButton color="gray" outline routeBased={routeBasedBack}>
            <ArrowLeftIcon />
          </PrevPageButton>
        {/if}
      </div>
      {#if title}
        <Heading
          tag="h3"
          class="flex grow basis-0 justify-center text-2xl font-bold md:text-4xl"
        >
          {title}
        </Heading>
      {/if}
      <div class="flex grow basis-0 flex-row justify-end gap-2">
        {#if slotRight}{@render slotRight()}{/if}
      </div>
    </div>
    {#if subtitle}
      <Heading tag="h5" class="flex justify-center text-xl font-bold">
        {subtitle}
      </Heading>
    {/if}
    {#if children}
      {@render children()}
    {/if}
  </div>
</div>
