<script lang="ts">
  import { Button, ButtonGroup } from "flowbite-svelte";

  import { statusToDisplay } from "@totallator/shared";
  import { defaultJournalFilter } from "@totallator/shared";
  import { summaryColumns } from "@totallator/shared";

  import { browser } from "$app/environment";
  import { enhance } from "$app/forms";
  import { goto, onNavigate } from "$app/navigation";
  import { page } from "$app/stores";

  import AssociatedInfoButtonPromise from "$lib/components/AssociatedInfoButtonPromise.svelte";
  import CustomHeader from "$lib/components/CustomHeader.svelte";
  import DownloadDropdown from "$lib/components/DownloadDropdown.svelte";
  import CategoryFilter from "$lib/components/filters/CategoryFilter.svelte";
  import DeleteIcon from "$lib/components/icons/DeleteIcon.svelte";
  import DisabledIcon from "$lib/components/icons/DisabledIcon.svelte";
  import EditIcon from "$lib/components/icons/EditIcon.svelte";
  import JournalEntryIcon from "$lib/components/icons/JournalEntryIcon.svelte";
  import JournalSummaryWithFetch from "$lib/components/JournalSummaryWithFetch.svelte";
  import PageLayout from "$lib/components/PageLayout.svelte";
  import RawDataModal from "$lib/components/RawDataModal.svelte";
  import SearchInput from "$lib/components/SearchInput.svelte";
  import CustomTable from "$lib/components/table/CustomTable.svelte";
  import { pageInfo, pageInfoStore, urlGenerator } from "$lib/routes.js";
  import { categoryColumnsStore } from "$lib/stores/columnDisplayStores.js";

  const { data } = $props();
  const urlInfo = $derived(pageInfo("/(loggedIn)/categories", $page));

  const urlStore = pageInfoStore({
    routeId: "/(loggedIn)/categories",
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
  pageTitle="Categories"
  filterText={data.filterText}
  pageNumber={data.categories.page}
  numPages={data.categories.pageCount}
/>

<PageLayout title="Categories" size="xl">
  {#snippet slotRight()}
    <Button
      color="light"
      outline
      href={urlGenerator({ address: "/(loggedIn)/categories/create" }).url}
    >
      Create
    </Button>
  {/snippet}
  <JournalSummaryWithFetch
    filter={{ category: data.searchParams }}
    latestUpdate={data.latestUpdate}
  />
  {#if $urlStore.searchParams && data.searchParams}
    <CustomTable
      highlightText={$urlStore.searchParams?.title}
      highlightTextColumns={["title", "group", "single"]}
      filterText={data.filterText}
      onSortURL={(newSort) =>
        urlInfo.updateParams({ searchParams: { orderBy: newSort } }).url}
      paginationInfo={{
        page: data.categories.page,
        count: data.categories.count,
        perPage: data.categories.pageSize,
        buttonCount: 5,
        urlForPage: (value) =>
          urlInfo.updateParams({ searchParams: { page: value } }).url,
      }}
      noneFoundText="No Matching Categories Found"
      data={data.categories.data}
      currentOrder={data.searchParams?.orderBy}
      currentFilter={data.searchParams}
      bind:numberRows={$urlStore.searchParams.pageSize}
      filterModalTitle="Filter Categories"
      bind:filterOpened
      columns={[
        { id: "actions", title: "" },
        {
          id: "group",
          title: "Group",
          rowToDisplay: (row) => row.group,
          sortKey: "group",
          showTitleOnMobile: true,
        },
        {
          id: "single",
          title: "Single",
          rowToDisplay: (row) => row.single,
          sortKey: "single",
          showTitleOnMobile: true,
        },
        {
          id: "title",
          title: "Title",
          rowToDisplay: (row) => row.title,
          sortKey: "title",
        },
        {
          id: "status",
          title: "Status",
          rowToDisplay: (row) => statusToDisplay(row.status),
          sortKey: "status",
          showTitleOnMobile: true,
        },

        ...summaryColumns({ currencyFormat: data.user?.currencyFormat }),
      ]}
      bind:shownColumns={$categoryColumnsStore}
      rowColour={(row) => (row.disabled ? "grey" : undefined)}
    >
      {#snippet slotCustomBodyCell({ row: currentRow, currentColumn })}
        {#if currentColumn.id === "actions"}
          {@const detailURL = urlGenerator({
            address: "/(loggedIn)/categories/[id]",
            paramsValue: { id: currentRow.id },
          }).url}

          {@const deleteURL = urlGenerator({
            address: "/(loggedIn)/categories/[id]/delete",
            paramsValue: { id: currentRow.id },
          }).url}
          {@const journalsURL = urlGenerator({
            address: "/(loggedIn)/journals",
            searchParamsValue: {
              ...defaultJournalFilter(),
              category: { id: currentRow.id },
            },
          }).url}
          <div class="flex flex-row justify-center">
            <form method="POST" action="?/update" use:enhance>
              <input type="hidden" name="id" value={currentRow.id} />
              <ButtonGroup>
                <Button href={journalsURL} class="p-2" outline color="blue">
                  <JournalEntryIcon height={15} width={15} />
                </Button>
                <Button href={detailURL} class="p-2" outline>
                  <EditIcon height={15} width={15} />
                </Button>
                {#if currentRow.disabled}
                  <Button
                    type="submit"
                    name="status"
                    value="active"
                    class="p-2"
                    color="primary"
                  >
                    <DisabledIcon />
                  </Button>
                {:else}
                  <Button
                    type="submit"
                    name="status"
                    value="disabled"
                    class="p-2"
                    outline
                  >
                    <DisabledIcon />
                  </Button>
                {/if}
                <Button
                  href={deleteURL}
                  class="p-2"
                  outline
                  color="red"
                  disabled={(currentRow.count || 0) > 0}
                >
                  <DeleteIcon height={15} width={15} />
                </Button>
                <AssociatedInfoButtonPromise
                  data={currentRow.associated}
                  target={{ categoryId: currentRow.id }}
                  id={currentRow.id}
                />
                <RawDataModal
                  data={currentRow}
                  title="Raw Category Data"
                  dev={data.dev}
                />
              </ButtonGroup>
            </form>
          </div>
        {/if}
      {/snippet}
      {#snippet slotFilterButtons()}
        <DownloadDropdown
          urlGenerator={(downloadType) =>
            urlGenerator({
              address: "/(loggedIn)/categories/download",
              searchParamsValue: { ...$urlStore.searchParams, downloadType },
            }).url}
        />
      {/snippet}
      {#snippet slotFilter()}
        <div class="flex flex-row gap-2">
          {#if $urlStore.searchParams}
            <SearchInput
              type="text"
              bind:value={$urlStore.searchParams.textFilter}
              placeholder="Filter..."
              class="flex grow"
              keys={data.autocompleteKeys}
            />
          {/if}
        </div>
      {/snippet}
      {#snippet slotFilterModal()}
        <CategoryFilter bind:filter={$urlStore.searchParams} />
      {/snippet}
    </CustomTable>{/if}
</PageLayout>
