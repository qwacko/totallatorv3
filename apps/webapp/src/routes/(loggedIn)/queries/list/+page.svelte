<script lang="ts">
  import {
    Button,
    ButtonGroup,
    Dropdown,
    DropdownItem,
    Input,
  } from "flowbite-svelte";

  import { page } from "$app/state";

  import CustomHeader from "$lib/components/CustomHeader.svelte";
  import FilterIcon from "$lib/components/icons/FilterIcon.svelte";
  import PageLayout from "$lib/components/PageLayout.svelte";
  import RawDataModal from "$lib/components/RawDataModal.svelte";
  import CustomTable from "$lib/components/table/CustomTable.svelte";
  import { sizeToText } from "$lib/helpers/sizeToText";
  import { pageInfo, urlGenerator } from "$lib/routes";
  import { queryColumnsStore } from "$lib/stores/columnDisplayStores";

  import QueryDetailModal from "./QueryDetailModal.svelte";
  import QueryXyChart from "./QueryXYChart.svelte";

  const { data } = $props();
  const urlInfo = pageInfo("/(loggedIn)/queries/list", () => page);


</script>

<CustomHeader
  pageTitle="Queries"
  filterText={data.filterText}
  pageNumber={data.data.page}
  numPages={data.data.pageCount}
/>

<PageLayout title="Queries Log" size="xl">
  {#await data.xyData then xyData}
    <QueryXyChart data={xyData} />
  {/await}
  {#if urlInfo.current.searchParams && data.searchParams}
    <CustomTable
      filterText={data.filterText}
      onSortURL={(newSort) =>
        urlInfo.updateParamsURLGenerator({ searchParams: { orderBy: newSort } }).url}
      paginationInfo={{
        page: data.data.page,
        count: data.data.count,
        perPage: data.data.pageSize,
        buttonCount: 5,
        urlForPage: (value) =>
          urlInfo.updateParamsURLGenerator({ searchParams: { page: value } }).url,
      }}
      noneFoundText="No Matching Queries Found"
      data={data.data.data}
      currentOrder={data.searchParams?.orderBy}
      currentFilter={data.searchParams}
      filterModalTitle="Filter Queries"
      bind:numberRows={urlInfo.current.searchParams.pageSize}
      columns={[
        { id: "actions", title: "" },
        {
          id: "title",
          title: "Title",
          sortKey: "title",
        },
        {
          id: "parameters",
          title: "Parameters",
          showTitleOnMobile: true,
        },
        {
          id: "duration",
          title: "Duration",
          sortKey: "duration",
          showTitleOnMobile: true,
        },
        {
          id: "time",
          title: "Time",
          sortKey: "time",
          showTitleOnMobile: true,
        },
        {
          id: "size",
          title: "Size",
          sortKey: "size",
          rowToDisplay: (row) => sizeToText(row.size),
          showTitleOnMobile: true,
        },
        {
          id: "params",
          title: "Params",
          rowToDisplay: (row) => row.params,
          showTitleOnMobile: true,
        },
      ]}
      bind:shownColumns={$queryColumnsStore}
    >
      {#snippet slotCustomBodyCell({ row: currentRow, currentColumn })}
        {#if currentColumn.id === "actions"}
          <div class="flex flex-row justify-center">
            <ButtonGroup>
              <QueryDetailModal data={currentRow} />
              <RawDataModal
                data={currentRow}
                title="Raw Grouped Query Data"
                dev={data.dev}
              />
            </ButtonGroup>
          </div>
        {:else if currentColumn.id === "title"}
          <div class="flex flex-row items-center gap-2">
            {currentRow.title}
            {#if currentRow.titleId}
              <Button
                size="xs"
                outline
                class="border-0"
                href={urlInfo.updateParamsURLGenerator({
                  searchParams: {
                    titleIdArray: [currentRow.titleId],
                  },
                }).url}
              >
                <FilterIcon />
              </Button>
            {/if}
          </div>
        {:else if currentColumn.id === "time"}
          {@const timeString = currentRow.time
            ? `${currentRow.time.toLocaleString()}.${String(currentRow.time.getMilliseconds()).padStart(3, "0")}`
            : ""}
          {@const minuteOffsets = [1, 2, 5, 10, 60, 120]}
          <div class="flex flex-row items-center gap-2">
            {timeString}
            <Button size="xs" outline class="border-0"><FilterIcon /></Button>
            <Dropdown simple>
              <DropdownItem
                href={urlInfo.updateParamsURLGenerator({
                  searchParams: {
                    start: currentRow.time.toISOString(),
                    end: currentRow.time.toISOString(),
                  },
                }).url}
              >
                {timeString}
              </DropdownItem>
              {#each minuteOffsets as currentOffset}
                {@const start = new Date(
                  currentRow.time.getTime() - currentOffset * 60 * 1000,
                )}
                {@const end = new Date(
                  currentRow.time.getTime() + currentOffset * 60 * 1000,
                )}
                <DropdownItem
                  href={urlInfo.updateParamsURLGenerator({
                    searchParams: {
                      start: start.toISOString(),
                      end: end.toISOString(),
                    },
                  }).url}
                >
                  ±{currentOffset} min
                </DropdownItem>
              {/each}
            </Dropdown>
          </div>
        {:else if currentColumn.id === "duration"}
          {@const duration = currentRow.duration || 0}
          {@const durationSpans = [1, 2, 5, 10, 50, 100]}
          <div class="flex flex-row items-center gap-2">
            {duration.toFixed() || ""}ms
            <Button size="xs" outline class="border-0"><FilterIcon /></Button>
            <Dropdown simple>
              <DropdownItem
                href={urlInfo.updateParamsURLGenerator({
                  searchParams: {
                    minDuration: duration,
                    maxDuration: duration,
                  },
                }).url}
              >
                {duration.toFixed()}ms
              </DropdownItem>
              {#each durationSpans as span}
                {@const max = duration + span}
                {@const min = Math.max(duration - span, 0)}
                <DropdownItem
                  href={urlInfo.updateParamsURLGenerator({
                    searchParams: { minDuration: min, maxDuration: max },
                  }).url}
                >
                  {min.toFixed()}ms to {max.toFixed()}ms
                </DropdownItem>
              {/each}
            </Dropdown>
          </div>
        {/if}
      {/snippet}
      {#snippet slotFilter()}
        <div class="flex flex-row gap-2">
          {#if urlInfo.current.searchParams}
            <Input
              type="text"
              bind:value={urlInfo.current.searchParams.textFilter}
              placeholder="Filter..."
              class="flex grow"
            />
          {/if}
          <Button
            href={urlGenerator({
              address: "/(loggedIn)/queries/list",
              searchParamsValue: { page: 0, pageSize: 10 },
            }).url}
            outline
          >
            Clear Filter
          </Button>
        </div>
      {/snippet}
    </CustomTable>{/if}
</PageLayout>
