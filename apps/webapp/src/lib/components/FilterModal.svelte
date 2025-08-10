<script
  lang="ts"
  generics="F extends JournalFilterSchemaType | JournalFilterSchemaWithoutPaginationType"
>
  import { Button, Modal } from "flowbite-svelte";
  import type { Snippet } from "svelte";

  import type {
    JournalFilterSchemaType,
    JournalFilterSchemaWithoutPaginationType,
  } from "@totallator/shared";

  import FilterModalContent from "./FilterModalContent.svelte";
  import FilterIcon from "./icons/FilterIcon.svelte";

  let {
    currentFilter,
    urlFromFilter,
    opened = $bindable(false),
    hideDates = false,
    modalTitle = "Journal Filter",
    slotFooterContents,
  }: {
    currentFilter: F;
    urlFromFilter?: (filter: F) => string;
    opened?: boolean;
    hideDates?: boolean;
    modalTitle?: string;
    slotFooterContents?: Snippet<[{ activeFilter: F }]>;
  } = $props();

  let url = $state("");
  let activeFilter = $state(currentFilter);
</script>

<Button color="light" onclick={() => (opened = true)}>
  <FilterIcon />
</Button>
<Modal bind:open={opened} size="lg" title={modalTitle} outsideclose>
  <FilterModalContent
    {currentFilter}
    {urlFromFilter}
    {hideDates}
    bind:url
    bind:activeFilter
  />
  {#snippet footer()}
    {#if slotFooterContents}
      {@render slotFooterContents({ activeFilter })}
    {:else}
      <Button onclick={() => (opened = false)} outline>Cancel</Button>
      <div class="grow"></div>
      <Button href={url}>Apply</Button>
    {/if}
  {/snippet}
</Modal>
