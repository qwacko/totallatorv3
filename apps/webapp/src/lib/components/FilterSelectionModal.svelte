<script lang="ts">
  import { Button, Modal } from "flowbite-svelte";
  import { onDestroy, onMount } from "svelte";

  import type { ReusableFilterDropdownListType } from "@totallator/business-logic";
  import {
    defaultAllJournalFilter,
    defaultJournalFilter,
    type JournalFilterSchemaType,
  } from "@totallator/shared";

  import { page } from "$app/stores";

  import ArrowRightIcon from "$lib/components/icons/ArrowRightIcon.svelte";

  import ArrowLeftIcon from "./icons/ArrowLeftIcon.svelte";

  let {
    shown = $bindable(false),
    filters,
    updateFilter,
    newFilter,
    showDefaultJournalFilters = false,
  }: {
    shown?: boolean;
    filters: ReusableFilterDropdownListType;
    updateFilter: (filter: JournalFilterSchemaType) => string;
    newFilter: (filter: JournalFilterSchemaType) => string;
    showDefaultJournalFilters?: boolean;
  } = $props();

  const filterKeys = $derived(
    Object.keys(filters).sort((a, b) => a.localeCompare(b)),
  );

  let selectedKey = $state<string | undefined>(undefined);

  $effect(() => {
    if (!shown && selectedKey) {
      selectedKey = undefined;
    }
  });

  const filterToURL = (
    filter: Pick<
      ReusableFilterDropdownListType[string][number],
      "filter" | "modificationType"
    >,
  ) => {
    if (filter.modificationType === "modify") {
      return updateFilter(filter.filter);
    }
    return newFilter(filter.filter);
  };

  let unsubscribe: (() => void) | undefined = undefined;

  onMount(() => {
    // Subscribe to page store for navigation changes
    unsubscribe = page.subscribe(() => {
      // Close the modal on any navigation
      shown = false;
    });
  });

  // Cleanup the subscription when the component is destroyed
  onDestroy(() => {
    unsubscribe && unsubscribe();
  });
</script>

<Modal bind:open={shown} size="lg" title="Filter Selection" outsideclose>
  <div class="flex flex-col gap-1">
    {#if selectedKey !== undefined}
      <div class="flex flex-row items-center gap-6 self-start">
        <Button
          size="sm"
          color="alternative"
          onclick={() => (selectedKey = undefined)}
        >
          <ArrowLeftIcon /> Back
        </Button>
        <div class="flex text-sm">
          {selectedKey}
        </div>
      </div>
    {/if}
    {#if selectedKey === undefined}
      {#if showDefaultJournalFilters}
        <Button
          size="sm"
          href={filterToURL({
            filter: defaultAllJournalFilter(),
            modificationType: "replace",
          })}
          class="flex flex-row gap-2"
        >
          All
        </Button>
        <Button
          size="sm"
          href={filterToURL({
            filter: defaultJournalFilter(),
            modificationType: "replace",
          })}
          class="flex flex-row gap-2"
        >
          Assets / Liabilities
        </Button>
      {/if}
      {#each filterKeys as currentKey}
        {@const hasChildren = filters[currentKey].length > 1}
        {#if hasChildren}
          <Button
            size="sm"
            onclick={() => (selectedKey = currentKey)}
            class="flex flex-row gap-2"
          >
            {currentKey}
            <ArrowRightIcon />
          </Button>
        {:else}
          <Button
            size="sm"
            href={filterToURL(filters[currentKey][0])}
            class="flex flex-row gap-2"
          >
            {currentKey}
          </Button>
        {/if}
      {/each}
    {:else}
      {@const currentFilterGroup = filters[selectedKey]}
      {#each currentFilterGroup as filter}
        <Button
          size="sm"
          href={filterToURL(filter)}
          class="flex flex-row gap-2"
        >
          {filter.title}
        </Button>
      {/each}
    {/if}
  </div>
</Modal>
