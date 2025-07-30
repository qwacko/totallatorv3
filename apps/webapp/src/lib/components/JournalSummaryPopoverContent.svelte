<script lang="ts">
  import { Chart } from "@flowbite-svelte-plugins/chart";
  import { Button, Spinner, TabItem, Tabs } from "flowbite-svelte";
  import { merge } from "lodash-es";

  import { getCurrencyFormatter } from "@totallator/shared";
  import type { SummaryCacheSchemaDataType } from "@totallator/shared";
  import {
    defaultJournalFilter,
    type JournalFilterSchemaInputType,
  } from "@totallator/shared";

  import { goto } from "$app/navigation";

  import type { DeepPartialWithoutArray } from "$lib/helpers/DeepPartialType";
  import { generateYearMonthsBeforeToday } from "$lib/helpers/generateYearMonthsBetween";
  import { urlGenerator } from "$lib/routes";
  import {
    popoverViewEnum,
    popoverViewStore,
    showSummaryStore,
  } from "$lib/stores/popoverView";
  import { currencyFormat } from "$lib/stores/userInfoStore";

  import DisplayCurrency from "./DisplayCurrency.svelte";
  import { filterTrendData } from "./helpers/FilterTrendData";
  import {
    generateFlowTrendConfig,
    generatePIChartConfig,
    generateTotalTrendConfig,
  } from "./helpers/generateTrendConfig";
  import EyeIcon from "./icons/EyeIcon.svelte";
  import JournalEntryIcon from "./icons/JournalEntryIcon.svelte";
  import TimeAndTransferButtons from "./journalSummary/TimeAndTransferButtons.svelte";

  const {
    item,
    summaryFilter = {},
    showJournalLink = false,
    loading,
  }: {
    item: SummaryCacheSchemaDataType;
    summaryFilter?: DeepPartialWithoutArray<
      Omit<JournalFilterSchemaInputType, "orderBy" | "page" | "pageSize">
    >;
    showJournalLink?: boolean;
    loading: boolean | undefined;
  } = $props();

  const chartHeight = "250";

  const gotoUpdatedFilter = async (
    updatedFilter: DeepPartialWithoutArray<
      Omit<JournalFilterSchemaInputType, "orderBy" | "page" | "pageSize">
    >,
  ) => {
    const combinedFilter = merge(summaryFilter, updatedFilter);

    const newURL = urlGenerator({
      address: "/(loggedIn)/journals",
      searchParamsValue: {
        ...defaultJournalFilter(),
        ...combinedFilter,
      },
    }).url;

    await goto(newURL);
  };

  const href = $derived(
    urlGenerator({
      address: "/(loggedIn)/journals",
      searchParamsValue: {
        ...defaultJournalFilter(),
        ...summaryFilter,
      },
    }).url,
  );

  let latestYearMonth = generateYearMonthsBeforeToday(12);
  const last12Months = $derived(
    filterTrendData({ data: item.monthlySummary, dates: latestYearMonth }),
  );

  const formatter = $derived(getCurrencyFormatter($currencyFormat));

  const yearChange = $derived(
    last12Months.reduce((prev, current) => prev + current.sum, 0),
  );
</script>

{#if $showSummaryStore}
  <div class="flex flex-col gap-2">
    <div class="flex flex-row gap-2">
      <Button
        color="light"
        size="xs"
        onclick={() => ($showSummaryStore = false)}
        class="h-8 flex-row gap-2"
      >
        <EyeIcon /> Hide Summary {#if loading}<Spinner size="4" />{/if}
      </Button>
      {#if showJournalLink}
        <Button {href} color="light" size="xs" class="h-8 flex-row gap-2">
          <JournalEntryIcon />
        </Button>
      {/if}
      <div class="flex grow flex-col items-end gap-0.5">
        <div class="flex text-lg">
          <DisplayCurrency amount={item.sum} />
        </div>

        <div class="flex text-xs">
          <DisplayCurrency amount={yearChange} positiveGreen={true} />
        </div>
      </div>
    </div>
    <Tabs contentClass="" style="underline">
      {#each popoverViewEnum as currentItem}
        <TabItem
          open={$popoverViewStore.type === currentItem}
          title={currentItem}
          onclick={() => ($popoverViewStore.type = currentItem)}
        />
      {/each}
    </Tabs>
    <div class="min-h-[280px]">
      <TimeAndTransferButtons bind:config={$popoverViewStore} />
      {#if $popoverViewStore.type === "Line"}
        {@const chartConfig = generateTotalTrendConfig({
          data: item.monthlySummary,
          formatter,
          height: chartHeight,
          onYearMonthClick: (yearMonth) =>
            gotoUpdatedFilter({ yearMonth: [yearMonth] }),
          config: $popoverViewStore,
        })}
        <Chart {...chartConfig} />
      {/if}

      {#if $popoverViewStore.type === "Flow"}
        {@const recentFlowChartConfig = generateFlowTrendConfig({
          data: item.monthlySummary,
          formatter,
          height: chartHeight,
          onYearMonthClick: (yearMonth) =>
            gotoUpdatedFilter({ yearMonth: [yearMonth] }),
          config: $popoverViewStore,
        })}
        <Chart {...recentFlowChartConfig} />
      {/if}

      {#if $popoverViewStore.type === "Account"}
        {@const accountsChartConfig = generatePIChartConfig({
          data: item.accounts,
          formatter,
          height: chartHeight,
          title: "Account",
          onClick: async (id) =>
            id
              ? gotoUpdatedFilter({
                  account: {
                    id,
                    type: ["asset", "liability", "income", "expense"],
                  },
                })
              : null,
          config: $popoverViewStore,
        })}
        <Chart {...accountsChartConfig} />
      {/if}

      {#if $popoverViewStore.type === "Tag"}
        {@const tagsChartConfig = generatePIChartConfig({
          data: item.tags,
          formatter,
          height: chartHeight,
          title: "Tag",
          onClick: async (id) =>
            id ? gotoUpdatedFilter({ tag: { id } }) : null,
          config: $popoverViewStore,
        })}
        <Chart {...tagsChartConfig} />
      {/if}

      {#if $popoverViewStore.type === "Category"}
        {@const categoriesChartConfig = generatePIChartConfig({
          data: item.categories,
          formatter,
          height: chartHeight,
          title: "Category",
          onClick: async (id) =>
            id ? gotoUpdatedFilter({ category: { id } }) : null,
          config: $popoverViewStore,
        })}
        <Chart {...categoriesChartConfig} />
      {/if}

      {#if $popoverViewStore.type === "Bill"}
        {@const billsChartConfig = generatePIChartConfig({
          data: item.bills,
          formatter,
          height: chartHeight,
          title: "Bills",
          onClick: async (id) =>
            id ? gotoUpdatedFilter({ bill: { id } }) : null,
          config: $popoverViewStore,
        })}
        <Chart {...billsChartConfig} />
      {/if}

      {#if $popoverViewStore.type === "Budget"}
        {@const budgetsChartConfig = generatePIChartConfig({
          data: item.budgets,
          formatter,
          height: chartHeight,
          title: "Budget",
          onClick: async (id) =>
            id ? gotoUpdatedFilter({ budget: { id } }) : null,
          config: $popoverViewStore,
        })}
        <Chart {...budgetsChartConfig} />
      {/if}
    </div>
  </div>
{:else}
  <div class="flex flex-row gap-2">
    <Button
      onclick={() => ($showSummaryStore = true)}
      color="light"
      size="xs"
      class="h-8 flex-row gap-2"
    >
      <EyeIcon /> Show Summary
    </Button>
    {#if showJournalLink}
      <Button {href} color="light" size="xs" class="h-8">
        <JournalEntryIcon />
      </Button>
    {/if}
    <div class="flex grow"></div>
  </div>
{/if}
