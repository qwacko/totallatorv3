<script lang="ts">
  import { Button } from "flowbite-svelte";

  import { browser } from "$app/environment";
  import { goto, onNavigate } from "$app/navigation";
  import { page } from "$app/stores";

  import CustomHeader from "$lib/components/CustomHeader.svelte";
  import PageLayout from "$lib/components/PageLayout.svelte";
  import RawDataModal from "$lib/components/RawDataModal.svelte";
  import CustomTable from "$lib/components/table/CustomTable.svelte";
  import { pageInfo, pageInfoStore, urlGenerator } from "$lib/routes.js";
  import { associatedInfoColumnsStore } from "$lib/stores/columnDisplayStores.js";

  import DisplayAssociatedLinks from "./DisplayAssociatedLinks.svelte";

  const { data } = $props();
  const urlInfo = $derived(pageInfo("/(loggedIn)/associated", $page));

  const urlStore = pageInfoStore({
    routeId: "/(loggedIn)/associated",
    pageInfo: page,
    onUpdate: (newURL) => {
      if (browser && newURL !== urlInfo.current.url) {
        goto(newURL, { keepFocus: true, noScroll: true });
      }
    },
    updateDelay: 500,
  });

  let filterOpened = $state(false);

  onNavigate(() => {
    filterOpened = false;
  });
</script>

<CustomHeader
  pageTitle="Associated Info"
  filterText={data.filterText}
  pageNumber={data.data.page}
  numPages={data.data.pageCount}
/>

<PageLayout title="Associated Info" size="xl">
  {#snippet slotRight()}
    <Button
      href={urlGenerator({ address: "/(loggedIn)/bills/create" }).url}
      color="light"
      outline
    >
      Create
    </Button>
  {/snippet}
  {#if $urlStore.searchParams && data.searchParams}
    <CustomTable
      filterText={data.filterText}
      onSortURL={(newSort) =>
        urlInfo.updateParams({ searchParams: { orderBy: newSort } }).url}
      paginationInfo={{
        page: data.data.page,
        count: data.data.count,
        perPage: data.data.pageSize,
        buttonCount: 5,
        urlForPage: (value) =>
          urlInfo.updateParams({ searchParams: { page: value } }).url,
      }}
      noneFoundText="No Matching Assocaited Info Found"
      data={data.data.data}
      currentOrder={data.searchParams?.orderBy}
      currentFilter={data.searchParams}
      filterModalTitle="Filter Associated Info"
      bind:numberRows={$urlStore.searchParams.pageSize}
      bind:filterOpened
      columns={[
        { id: "actions", title: "" },
        {
          id: "createdAt",
          title: "Created",
          rowToDisplay: (row) => row.createdAt.toISOString().slice(0, 10),
          sortKey: "createdAt",
          showTitleOnMobile: true,
        },
        {
          id: "title",
          title: "Title",
          rowToDisplay: (row) => row.title || "",
          sortKey: "title",
        },
        {
          id: "links",
          title: "Links",
        },
      ]}
      bind:shownColumns={$associatedInfoColumnsStore}
    >
      {#snippet slotCustomBodyCell({ row: currentRow, currentColumn })}
        {#if currentColumn.id === "actions"}
          <RawDataModal
            data={currentRow}
            title="Raw Associated Info Data"
            dev={data.dev}
          />
        {:else if currentColumn.id === "links"}
          <DisplayAssociatedLinks data={currentRow} />
        {/if}
      {/snippet}
    </CustomTable>
  {/if}
</PageLayout>
