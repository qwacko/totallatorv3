<script lang="ts">
  import { Badge, Button, Dropdown } from "flowbite-svelte";

  import {
    defaultJournalFilter,
    type JournalFilterSchemaType,
  } from "@totallator/shared";

  import { urlGenerator } from "$lib/routes";

  import BudgetIcon from "./icons/BudgetIcon.svelte";
  import FilterIcon from "./icons/FilterIcon.svelte";
  import JournalEntryIcon from "./icons/JournalEntryIcon.svelte";

  const {
    data,
    currentFilter,
  }: {
    data: { budgetId: string | null; budgetTitle: string | null };
    currentFilter: JournalFilterSchemaType;
  } = $props();

  let opened = $state(false);

  const filterURL = $derived(
    urlGenerator({
      address: "/(loggedIn)/journals",
      searchParamsValue: {
        ...currentFilter,
        budget: {
          id: data.budgetId || undefined,
        },
      },
    }).url,
  );

  const viewURL = $derived(
    urlGenerator({
      address: "/(loggedIn)/journals",
      searchParamsValue: {
        ...defaultJournalFilter(),
        budget: {
          id: data.budgetId || undefined,
        },
      },
    }).url,
  );
</script>

{#if data.budgetTitle && data.budgetId}
  <Badge class="gap-2" onclick={() => (opened = true)}>
    <BudgetIcon />
    {data.budgetTitle}
  </Badge>
  <Dropdown bind:isOpen={opened} class="w-52 border p-2" simple>
    <div class="flex flex-col gap-1">
      {#if data.budgetTitle}
        <div class="flex">
          {data.budgetTitle}
        </div>
      {/if}
      <div class="flex flex-row justify-between">
        <Button href={viewURL} outline color="light" size="xs"
          ><JournalEntryIcon /></Button
        >
        <Button href={filterURL} outline color="light" size="xs"
          ><FilterIcon /></Button
        >
      </div>
    </div>
  </Dropdown>
{/if}
