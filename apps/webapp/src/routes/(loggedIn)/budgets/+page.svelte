<script lang="ts">
  import { Button, ButtonGroup } from "flowbite-svelte";

  import { statusToDisplay } from "@totallator/shared";
  import { defaultJournalFilter } from "@totallator/shared";
  import { summaryColumns } from "@totallator/shared";

  import { enhance } from "$app/forms";
  import { onNavigate } from "$app/navigation";
  import { page } from "$app/state";

  import AssociatedInfoButtonPromise from "$lib/components/AssociatedInfoButtonPromise.svelte";
  import CustomHeader from "$lib/components/CustomHeader.svelte";
  import DownloadDropdown from "$lib/components/DownloadDropdown.svelte";
  import BudgetFilter from "$lib/components/filters/BudgetFilter.svelte";
  import DeleteIcon from "$lib/components/icons/DeleteIcon.svelte";
  import DisabledIcon from "$lib/components/icons/DisabledIcon.svelte";
  import EditIcon from "$lib/components/icons/EditIcon.svelte";
  import JournalEntryIcon from "$lib/components/icons/JournalEntryIcon.svelte";
  import JournalSummaryWithFetch from "$lib/components/JournalSummaryWithFetch.svelte";
  import PageLayout from "$lib/components/PageLayout.svelte";
  import RawDataModal from "$lib/components/RawDataModal.svelte";
  import SearchInput from "$lib/components/SearchInput.svelte";
  import CustomTable from "$lib/components/table/CustomTable.svelte";
  import { pageInfo, urlGenerator } from "$lib/routes.js";
  import { budgetColumnsStore } from "$lib/stores/columnDisplayStores.js";

  const { data } = $props();
  const urlInfo = pageInfo("/(loggedIn)/budgets", () => page);



  let filterOpened = $state(false);

  onNavigate(() => {
    filterOpened = false;
  });
</script>

<CustomHeader
  pageTitle="Budgets"
  filterText={data.filterText}
  pageNumber={data.budgets.page}
  numPages={data.budgets.pageCount}
/>

<PageLayout title="Budgets" size="xl">
  {#snippet slotRight()}
    <Button
      href={urlGenerator({ address: "/(loggedIn)/budgets/create" }).url}
      color="light"
      outline
    >
      Create
    </Button>
  {/snippet}
  <JournalSummaryWithFetch
    filter={{ budget: data.searchParams }}
    latestUpdate={data.latestUpdate}
  />
  {#if urlInfo.current.searchParams && data.searchParams}
    <CustomTable
      highlightText={urlInfo.current.searchParams?.title}
      highlightTextColumns={["title", "group", "single"]}
      filterText={data.filterText}
      onSortURL={(newSort) =>
        urlInfo.updateParamsURLGenerator({ searchParams: { orderBy: newSort } }).url}
      paginationInfo={{
        page: data.budgets.page,
        count: data.budgets.count,
        perPage: data.budgets.pageSize,
        buttonCount: 5,
        urlForPage: (value) =>
          urlInfo.updateParamsURLGenerator({ searchParams: { page: value } }).url,
      }}
      noneFoundText="No Matching Budgets Found"
      data={data.budgets.data}
      currentOrder={data.searchParams?.orderBy}
      currentFilter={data.searchParams}
      filterModalTitle="Filter Budgets"
      bind:numberRows={urlInfo.current.searchParams.pageSize}
      bind:filterOpened
      columns={[
        { id: "actions", title: "" },

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
      bind:shownColumns={$budgetColumnsStore}
      rowColour={(row) => (row.disabled ? "grey" : undefined)}
    >
      {#snippet slotCustomBodyCell({ row: currentRow, currentColumn })}
        {#if currentColumn.id === "actions"}
          {@const detailURL = urlGenerator({
            address: "/(loggedIn)/budgets/[id]",
            paramsValue: { id: currentRow.id },
          }).url}

          {@const deleteURL = urlGenerator({
            address: "/(loggedIn)/budgets/[id]/delete",
            paramsValue: { id: currentRow.id },
          }).url}
          {@const journalsURL = urlGenerator({
            address: "/(loggedIn)/journals",
            searchParamsValue: {
              ...defaultJournalFilter(),
              budget: { id: currentRow.id },
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
                  target={{ budgetId: currentRow.id }}
                  id={currentRow.id}
                />
                <RawDataModal
                  data={currentRow}
                  title="Raw Budget Data"
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
              address: "/(loggedIn)/budgets/download",
              searchParamsValue: { ...urlInfo.current.searchParams, downloadType },
            }).url}
        />
      {/snippet}
      {#snippet slotFilter()}
        <div class="flex flex-row gap-2">
          {#if urlInfo.current.searchParams}
            <SearchInput
              type="text"
              bind:value={urlInfo.current.searchParams.textFilter}
              placeholder="Filter..."
              class="flex grow"
              keys={data.autocompleteKeys}
            />
          {/if}
        </div>
      {/snippet}
      {#snippet slotFilterModal()}
        <BudgetFilter bind:filter={urlInfo.current.searchParams} />
      {/snippet}
    </CustomTable>
  {/if}
</PageLayout>
