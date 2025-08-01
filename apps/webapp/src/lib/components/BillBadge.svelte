<script lang="ts">
  import { Badge, Button, Dropdown } from "flowbite-svelte";

  import {
    defaultJournalFilter,
    type JournalFilterSchemaType,
  } from "@totallator/shared";

  import { urlGenerator } from "$lib/routes";

  import BillIcon from "./icons/BillIcon.svelte";
  import FilterIcon from "./icons/FilterIcon.svelte";
  import JournalEntryIcon from "./icons/JournalEntryIcon.svelte";

  const {
    data,
    currentFilter,
  }: {
    data: { billId: string | null; billTitle: string | null };
    currentFilter: JournalFilterSchemaType;
  } = $props();

  let opened = $state(false);

  const filterURL = $derived(
    urlGenerator({
      address: "/(loggedIn)/journals",
      searchParamsValue: {
        ...currentFilter,
        bill: {
          id: data.billId || undefined,
        },
      },
    }).url,
  );

  const viewURL = $derived(
    urlGenerator({
      address: "/(loggedIn)/journals",
      searchParamsValue: {
        ...defaultJournalFilter(),
        bill: {
          id: data.billId || undefined,
        },
      },
    }).url,
  );
</script>

{#if data.billTitle && data.billId}
  <Badge class="gap-2" onclick={() => (opened = true)}>
    <BillIcon />
    {data.billTitle}
  </Badge>
  <Dropdown bind:isOpen={opened} class="w-52 border p-2" simple>
    <div class="flex flex-col gap-1">
      {#if data.billTitle}
        <div class="flex">
          {data.billTitle}
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
