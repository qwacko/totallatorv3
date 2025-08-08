<script lang="ts">
  import { Button, ButtonGroup, DropdownItem, Input } from "flowbite-svelte";

  import {
    defaultAllJournalFilter,
    defaultJournalFilter,
  } from "@totallator/shared";
  import { llmReviewStatusEnumSelection } from "@totallator/shared";

  import { enhance } from "$app/forms";
  import { onNavigate } from "$app/navigation";
  import { page } from "$app/state";

  import AccountBadge from "$lib/components/AccountBadge.svelte";
  import AssociatedInfoButtonPromise from "$lib/components/AssociatedInfoButtonPromise.svelte";
  import BillBadge from "$lib/components/BillBadge.svelte";
  import BudgetBadge from "$lib/components/BudgetBadge.svelte";
  import CategoryBadge from "$lib/components/CategoryBadge.svelte";
  import CustomHeader from "$lib/components/CustomHeader.svelte";
  import DateInput from "$lib/components/DateInput.svelte";
  import DownloadDropdown from "$lib/components/DownloadDropdown.svelte";
  import EnumArraySelection from "$lib/components/EnumArraySelection.svelte";
  import FilterDropdown from "$lib/components/FilterDropdown.svelte";
  import FilterModalContent from "$lib/components/FilterModalContent.svelte";
  import ArrowDownIcon from "$lib/components/icons/ArrowDownIcon.svelte";
  import ArrowLeftIcon from "$lib/components/icons/ArrowLeftIcon.svelte";
  import ArrowRightIcon from "$lib/components/icons/ArrowRightIcon.svelte";
  import ArrowUpIcon from "$lib/components/icons/ArrowUpIcon.svelte";
  import CloneIcon from "$lib/components/icons/CloneIcon.svelte";
  import CompleteIcon from "$lib/components/icons/CompleteIcon.svelte";
  import DataCheckedIcon from "$lib/components/icons/DataCheckedIcon.svelte";
  import DeleteIcon from "$lib/components/icons/DeleteIcon.svelte";
  import EditIcon from "$lib/components/icons/EditIcon.svelte";
  import FilterIcon from "$lib/components/icons/FilterIcon.svelte";
  import PlusIcon from "$lib/components/icons/PlusIcon.svelte";
  import ReconciledIcon from "$lib/components/icons/ReconciledIcon.svelte";
  import JournalSummaryWithFetch from "$lib/components/JournalSummaryWithFetch.svelte";
  import LabelBadge from "$lib/components/LabelBadge.svelte";
  import LlmReviewStatusBadge from "$lib/components/LlmReviewStatusBadge.svelte";
  import PageLayout from "$lib/components/PageLayout.svelte";
  import RawDataModal from "$lib/components/RawDataModal.svelte";
  import RecommendationButton from "$lib/components/RecommendationButton.svelte";
  import SearchInput from "$lib/components/SearchInput.svelte";
  import CustomTable from "$lib/components/table/CustomTable.svelte";
  import DropdownFilterNestedText from "$lib/components/table/DropdownFilterNestedText.svelte";
  import TagBadge from "$lib/components/TagBadge.svelte";
  import { pageInfo, urlGenerator } from "$lib/routes.js";
  import { journalColumnsStore } from "$lib/stores/columnDisplayStores.js";

  import BulkJournalActions from "./BulkJournalActions.svelte";

  const { data } = $props();

  const urlInfo = pageInfo("/(loggedIn)/journals", () => page);

  let filterOpened = $state(false);

  onNavigate(() => {
    filterOpened = false;
  });


</script>

<CustomHeader
  pageTitle="Journals"
  filterText={data.filterText}
  pageNumber={data.journals.page}
  numPages={data.journals.pageCount}
/>

<PageLayout title="Journals" size="xl">
  {#snippet slotRight()}
    <Button
      color="light"
      outline
      href={urlGenerator({
        address: "/(loggedIn)/journals/create",
        searchParamsValue: urlInfo.current.searchParams || defaultJournalFilter(),
      }).url}
    >
      <PlusIcon />
    </Button>
  {/snippet}
  <JournalSummaryWithFetch
    filter={data.searchParamsWithoutPagination}
    latestUpdate={data.latestUpdate}
  />

  {#if urlInfo.current.searchParams && data.searchParams}
    <CustomTable
      highlightText={urlInfo.current.searchParams.description}
      highlightTextColumns={["description"]}
      filterText={data.filterText}
      onSortURL={(newSort) =>
        urlInfo.updateParamsURLGenerator({ searchParams: { orderBy: newSort } }).url}
      paginationInfo={{
        page: data.journals.page,
        perPage: data.journals.pageSize,
        count: data.journals.count,
        buttonCount: 5,
        urlForPage: (value) =>{
          return urlInfo.updateParamsURLGenerator({searchParams: {page:value}}).url},
      }}
      noneFoundText="No Matching Journals Found"
      data={data.journals.data}
      currentOrder={data.searchParams.orderBy}
      currentFilter={data.searchParams}
      filterModalTitle="Filter Journals"
      bulkSelection
      bind:numberRows={urlInfo.current.searchParams.pageSize}
      bind:filterOpened
      rowToId={(row) => row.id}
      columns={[
        { id: "actions", title: "" },
        {
          id: "dateText",
          title: "Date",
          rowToDisplay: (row) => row.dateText,
          sortKey: "date",
          filterActive:
            Boolean(urlInfo.current.searchParams.dateAfter) ||
            Boolean(urlInfo.current.searchParams.dateBefore),
        },
        {
          id: "account",
          title: "Account",
          enableDropdown: true,
          customCell: true,
          filterActive: Boolean(
            urlInfo.current.searchParams.account?.title ? true : false,
          ),
        },
        { id: "direction", title: "", customCell: true },
        {
          id: "payee",
          title: "Payee(s)",
          enableDropdown: true,
          customCell: true,
          filterActive: Boolean(
            urlInfo.current.searchParams.payee?.title ? true : false,
          ),
        },
        {
          id: "description",
          title: "Description",
          sortKey: "description",
          rowToDisplay: (row) => row.description,
          filterActive: Boolean(
            urlInfo.current.searchParams.description &&
              urlInfo.current.searchParams.description.length > 0,
          ),
        },
        {
          id: "amount",
          title: "Amount",
          sortKey: "amount",
          customCell: true,
          rowToCurrency: (row) => ({
            amount: row.amount,
          }),
        },
        {
          id: "total",
          title: "Total",
          rowToCurrency: (row) => ({
            amount: row.total,
          }),
          showTitleOnMobile: true,
        },
        {
          id: "llmReviewStatus",
          title: "LLM Status",
          sortKey: "llmReviewStatus",
          customCell: true,
          filterActive: Boolean(urlInfo.current.searchParams.llmReviewStatus),
        },
        { id: "relations", title: "Relations", customCell: true },
      ]}
      bind:shownColumns={$journalColumnsStore}
    >
      {#snippet slotBulkActions({ selectedIds })}
        <BulkJournalActions
          {selectedIds}
          allCount={data.journals.count}
          searchParams={urlInfo.current.searchParams}
        />
      {/snippet}
      {#snippet slotFilterButtons()}
        {#if urlInfo.current.searchParams}
          <FilterDropdown
            filters={data.filterDropdown}
            newFilter={(newFilter) =>
              urlGenerator({
                address: "/(loggedIn)/journals",
                searchParamsValue: {
                  ...newFilter,
                  page: urlInfo.current.searchParams?.page || 0,
                  pageSize: urlInfo.current.searchParams?.pageSize || 10,
                },
              }).url}
            updateFilter={(newFilter) =>
              urlInfo.updateParamsURLGenerator({ searchParams: newFilter }).url}
            currentFilter={urlInfo.current.searchParams}
          />
          <DownloadDropdown
            urlGenerator={(downloadType) => {
              if (urlInfo.current.searchParams) {
                return urlGenerator({
                  address: "/(loggedIn)/journals/download",
                  searchParamsValue: {
                    ...urlInfo.current.searchParams,
                    downloadType,
                  },
                }).url;
              }
              return "";
            }}
          />
        {/if}
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
        {#if urlInfo.current.searchParams}
          <FilterModalContent
            currentFilter={urlInfo.current.searchParams}
            urlFromFilter={(newFilter) =>
              urlInfo.updateParamsURLGenerator({ searchParams: newFilter }).url}
          />
        {/if}
      {/snippet}
      {#snippet slotCustomBodyCell({ row: currentJournal, currentColumn })}
        {#if currentColumn.id === "actions"}
          <form action="?/update" method="post" use:enhance>
            <input type="hidden" value={currentJournal.id} name="journalId" />
            <ButtonGroup size="sm" class="flex-wrap md:flex-nowrap">
              <Button
                href={urlGenerator({
                  address: "/(loggedIn)/journals/bulkEdit",
                  searchParamsValue: {
                    idArray: [currentJournal.id],
                    ...defaultAllJournalFilter(),
                  },
                }).url}
                class="p-2"
              >
                <EditIcon height="15" width="15" />
              </Button>
              <Button
                disabled={false}
                href={urlGenerator({
                  address: "/(loggedIn)/journals/clone",
                  searchParamsValue: {
                    idArray: [currentJournal.id],
                    ...defaultAllJournalFilter(),
                  },
                }).url}
                class="p-2"
              >
                <CloneIcon height="15" width="15" />
              </Button>
              <Button
                disabled={false}
                href={urlGenerator({
                  address: "/(loggedIn)/journals/delete",
                  searchParamsValue: {
                    idArray: [currentJournal.id],
                    ...defaultAllJournalFilter(),
                  },
                }).url}
                class="p-2"
              >
                <DeleteIcon height="15" width="15" />
              </Button>
              <Button
                disabled={false}
                href={urlGenerator({
                  address: "/(loggedIn)/journals",
                  searchParamsValue: {
                    ...defaultJournalFilter(),
                    account: {
                      idArray: [currentJournal.accountId],
                    },
                    payee: {
                      idArray: currentJournal.otherJournals.map(
                        (journal) => journal.accountId,
                      ),
                    },
                    description: currentJournal.description,
                  },
                }).url}
                class="p-2"
              >
                <FilterIcon height="15" width="15" />
              </Button>
              {#if currentJournal.complete}
                <Button
                  class="p-2"
                  type="submit"
                  name="action"
                  color="primary"
                  value="uncomplete"
                >
                  <CompleteIcon height="15" width="15" />
                </Button>
              {:else}
                <Button
                  class="p-2"
                  type="submit"
                  name="action"
                  value="complete"
                >
                  <CompleteIcon height="15" width="15" />
                </Button>
              {/if}
              {#if currentJournal.reconciled}
                <Button
                  class="p-2"
                  type="submit"
                  name="action"
                  color="primary"
                  value="unreconcile"
                  disabled={currentJournal.complete}
                >
                  <ReconciledIcon height="15" width="15" />
                </Button>
              {:else}
                <Button
                  class="p-2"
                  type="submit"
                  name="action"
                  value="reconcile"
                  disabled={currentJournal.complete}
                >
                  <ReconciledIcon height="15" width="15" />
                </Button>
              {/if}

              {#if currentJournal.dataChecked}
                <Button
                  class="p-2"
                  type="submit"
                  name="action"
                  color="primary"
                  value="uncheck"
                  disabled={currentJournal.complete}
                >
                  <DataCheckedIcon height="15" width="15" />
                </Button>
              {:else}
                <Button
                  class="p-2"
                  type="submit"
                  name="action"
                  value="check"
                  disabled={currentJournal.complete}
                >
                  <DataCheckedIcon height="15" width="15" />
                </Button>
              {/if}

              <AssociatedInfoButtonPromise
                data={currentJournal.associated}
                target={{ transactionId: currentJournal.transactionId }}
                id={currentJournal.id}
              />

              <RecommendationButton
                recommendations={data.journalRecommendations}
                journal={currentJournal}
              />
              <RawDataModal
                data={currentJournal}
                dev={true}
                title="Journal Data"
                icon="more"
              />
            </ButtonGroup>
          </form>
        {:else if currentColumn.id === "account"}
          <AccountBadge
            accountInfo={{
              type: currentJournal.accountType,
              title: currentJournal.accountTitle,
              id: currentJournal.accountId,
              accountGroupCombinedTitle: currentJournal.accountGroup,
            }}
            currentFilter={urlInfo.current.searchParams || defaultJournalFilter()}
          />
        {:else if currentColumn.id === "direction"}
          {#if currentJournal.amount > 0}
            <ArrowLeftIcon class="hidden md:flex" />
            <ArrowUpIcon class="flex md:hidden" />
          {:else}
            <ArrowRightIcon class="hidden md:flex" />
            <ArrowDownIcon class="flex md:hidden" />
          {/if}
        {:else if currentColumn.id === "payee"}
          {#if currentJournal.otherJournals.length === 1}
            {@const currentOtherJournal = currentJournal.otherJournals[0]}
            <AccountBadge
              accountInfo={{
                type: currentOtherJournal.accountType,
                title: currentOtherJournal.accountTitle,
                id: currentOtherJournal.accountId,
                accountGroupCombinedTitle: currentOtherJournal.accountGroup,
              }}
              currentFilter={urlInfo.current.searchParams || defaultJournalFilter()}
              payeeFilter
            />
          {:else}
            <div class="flex flex-col">
              {#each currentJournal.otherJournals as currentOtherJournal}
                <AccountBadge
                  accountInfo={{
                    type: currentOtherJournal.accountType,
                    title: currentOtherJournal.accountTitle,
                    id: currentOtherJournal.accountId,
                    accountGroupCombinedTitle: currentOtherJournal.accountGroup,
                  }}
                  currentFilter={urlInfo.current.searchParams ||
                    defaultJournalFilter()}
                  payeeFilter
                />
              {/each}
            </div>
          {/if}
        {:else if currentColumn.id === "relations"}
          <div class="flex flex-row flex-wrap gap-1">
            <CategoryBadge
              data={currentJournal}
              currentFilter={urlInfo.current.searchParams || defaultJournalFilter()}
            />
            <TagBadge
              data={currentJournal}
              currentFilter={urlInfo.current.searchParams || defaultJournalFilter()}
            />
            <BillBadge
              data={currentJournal}
              currentFilter={urlInfo.current.searchParams || defaultJournalFilter()}
            />
            <BudgetBadge
              data={currentJournal}
              currentFilter={urlInfo.current.searchParams || defaultJournalFilter()}
            />
            {#each currentJournal.labels as currentLabel}
              <LabelBadge
                data={currentLabel}
                currentFilter={urlInfo.current.searchParams || defaultJournalFilter()}
              />
            {/each}
          </div>
        {:else if currentColumn.id === "llmReviewStatus"}
          <LlmReviewStatusBadge
            status={currentJournal.llmReviewStatus}
            currentFilter={urlInfo.current.searchParams || defaultJournalFilter()}
          />
        {/if}
      {/snippet}
      {#snippet slotHeaderItem({ currentColumn })}
        {#if urlInfo.current.searchParams}
          {#if currentColumn.id === "description"}
            {#if urlInfo.current.searchParams.description !== null}
              <DropdownItem>
                <Input
                  type="text"
                  bind:value={urlInfo.current.searchParams.description}
                  placeholder="Filter By Description"
                />
              </DropdownItem>
            {/if}
          {:else if currentColumn.id === "account"}
            <DropdownFilterNestedText
              bind:params={urlInfo.current.searchParams.account}
              key="title"
            />
          {:else if currentColumn.id === "payee"}
            <DropdownFilterNestedText
              bind:params={urlInfo.current.searchParams.payee}
              key="title"
            />
          {:else if currentColumn.id === "llmReviewStatus"}
            <DropdownItem>
              <EnumArraySelection
                bind:values={urlInfo.current.searchParams.llmReviewStatus}
                enumSelection={llmReviewStatusEnumSelection}
              />
            </DropdownItem>
          {:else if currentColumn.id === "dateText"}
            <DropdownItem>
              <DateInput
                title="Date After"
                bind:value={urlInfo.current.searchParams.dateAfter}
                name=""
                errorMessage=""
              />
            </DropdownItem>
            <DropdownItem>
              <DateInput
                title="Date Before"
                bind:value={urlInfo.current.searchParams.dateBefore}
                name=""
                errorMessage=""
              />
            </DropdownItem>
          {/if}
        {/if}
      {/snippet}
    </CustomTable>
  {/if}
</PageLayout>
