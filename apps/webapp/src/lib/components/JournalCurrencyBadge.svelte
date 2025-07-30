<script lang="ts">
  import { Badge, type BadgeProps } from "flowbite-svelte";

  import DisplayCurrency from "./DisplayCurrency.svelte";

  const {
    href,
    id,
    items,
    ...restProps
  }: {
    href: string;
    id: string;
    items: Promise<{ id: string; sum: number }[]>;
  } & Omit<BadgeProps, "href"> = $props();

  const { children, ...restWithoutChildren } = $derived(restProps);
</script>

<Badge {href} {...restWithoutChildren}>
  {#await items}
    ...
  {:then resolvedItems}
    {@const matchingItem = resolvedItems.find((item) => item.id === id)}
    {#if matchingItem}
      <DisplayCurrency amount={matchingItem.sum} />
    {:else}
      Error
    {/if}
  {/await}
</Badge>
