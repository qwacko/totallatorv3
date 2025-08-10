<script lang="ts">
  import { Badge, Heading } from "flowbite-svelte";

  import CustomHeader from "$lib/components/CustomHeader.svelte";
  import FileLinkingCard from "$lib/components/FileLinkingCard.svelte";
  import PageLayout from "$lib/components/PageLayout.svelte";
  import RawDataModal from "$lib/components/RawDataModal.svelte";

  const { data } = $props();

  const keys = $derived([
    { key: "accountId", value: null },
    { key: "autoImportId", value: null },
    { key: "billId", value: null },
    { key: "categoryId", value: null },
    { key: "budgetId", value: null },
    { key: "labelId", value: null },
    { key: "reportElementId", value: null },
    { key: "reportId", value: null },
    { key: "tagId", value: null },
    { key: "transactionId", value: data.transactionId },
  ]);
</script>

<CustomHeader pageTitle="Link To Transaction" />

<PageLayout title="Link To Transaction" size="lg">
  <Heading tag="h2">Likely Items</Heading>
  <RawDataModal data={data.likelyFiles} dev={data.dev} />
  <div class="flex flex-row flex-wrap gap-4">
    {#if !data.likelyFiles || data.likelyFiles.length === 0}
      <Badge>No likely files found</Badge>
    {:else}
      {#each data.likelyFiles as item}
        <FileLinkingCard {item} {keys} />
      {/each}
    {/if}
  </div>
  <Heading tag="h2">Unlinked Items</Heading>
  <RawDataModal data={data.unlinkedFiles} dev={data.dev} />
  <div class="flex flex-row flex-wrap gap-4">
    {#if !data.unlinkedFiles || data.unlinkedFiles.length === 0}
      <Badge>No unlinked files found</Badge>
    {:else}
      {#each data.unlinkedFiles as item}
        <FileLinkingCard {item} {keys} />
      {/each}
    {/if}
  </div>
  <Heading tag="h2">Currently Linked Items</Heading>
  <RawDataModal data={data.currentlyLinkedItems} dev={data.dev} />
  <div class="flex flex-row flex-wrap gap-4">
    {#if !data.currentlyLinkedItems || data.currentlyLinkedItems.length === 0}
      <Badge>No currently linked files found</Badge>
    {:else}
      {#each data.currentlyLinkedItems as item}
        <FileLinkingCard
          {item}
          keys={[{ key: "transactionId", value: null }]}
        />
      {/each}
    {/if}
  </div>
</PageLayout>
