<script
  lang="ts"
  generics="F extends JournalFilterSchemaType | JournalFilterSchemaWithoutPaginationType"
>
  import { Button, Input } from "flowbite-svelte";

  import { getDateSpanDropdown } from "@totallator/shared";
  import { llmReviewStatusEnumSelection } from "@totallator/shared";
  import type {
    JournalFilterSchemaType,
    JournalFilterSchemaWithoutPaginationType,
  } from "@totallator/shared";

  import DateInput from "../DateInput.svelte";
  import EnumArraySelection from "../EnumArraySelection.svelte";
  import SelectInput from "../SelectInput.svelte";
  import TextInput from "../TextInput.svelte";
  import BooleanFilterButtons from "./BooleanFilterButtons.svelte";
  import FilterIdArray from "./FilterIdArray.svelte";
  import IdFilter from "./IDFilter.svelte";

  let {
    activeFilter = $bindable(),
    hideDates = false,
  }: { activeFilter: F; hideDates?: boolean } = $props();
  let yearMonth = $state<string>("");
  let excludeYearMonth = $state<string>("");
</script>

<div class="flex flex-col gap-2">
  <TextInput
    bind:value={activeFilter.textFilter}
    name="textFilter"
    title="Text Filter"
    errorMessage=""
  />
  <IdFilter bind:id={activeFilter.id} />
  <FilterIdArray title="Journal IDs" bind:idArray={activeFilter.idArray} />
  <FilterIdArray
    title="Transaction IDs"
    bind:idArray={activeFilter.transactionIdArray}
  />
  <FilterIdArray title="Import IDs" bind:idArray={activeFilter.importIdArray} />
  <FilterIdArray
    title="Import Detail IDs"
    bind:idArray={activeFilter.importDetailIdArray}
  />
  {#if !hideDates}
    <div class="flex text-sm font-semibold text-black">Year Month</div>
    <div class="flex flex-row gap-1">
      <Input
        bind:value={yearMonth}
        class="flex grow"
        placeholder="year-month (i.e. 2020-12)..."
      />
      <Button
        onclick={() =>
          activeFilter.yearMonth
            ? (activeFilter.yearMonth = [...activeFilter.yearMonth, yearMonth])
            : (activeFilter.yearMonth = [yearMonth])}
      >
        Add
      </Button>
    </div>
    {#if activeFilter.yearMonth && activeFilter.yearMonth.length > 0}
      <div class="flex flex-row flex-wrap gap-2">
        {#each activeFilter.yearMonth as currentYearMonth}
          <Button
            class="whitespace-nowrap"
            size="xs"
            color="light"
            onclick={() =>
              activeFilter.yearMonth &&
              (activeFilter.yearMonth = activeFilter.yearMonth.filter(
                (item) => item !== currentYearMonth,
              ))}
          >
            {currentYearMonth}
          </Button>{/each}
      </div>
    {/if}
    <div class="flex text-sm font-semibold text-black">Exclude Year Month</div>
    <div class="flex flex-row gap-1">
      <Input
        bind:value={excludeYearMonth}
        class="flex grow"
        placeholder="year-month (i.e. 2020-12)..."
      />
      <Button
        onclick={() =>
          activeFilter.excludeYearMonth
            ? (activeFilter.excludeYearMonth = [
                ...activeFilter.excludeYearMonth,
                excludeYearMonth,
              ])
            : (activeFilter.excludeYearMonth = [excludeYearMonth])}
      >
        Add
      </Button>
    </div>
    {#if activeFilter.excludeYearMonth && activeFilter.excludeYearMonth.length > 0}
      <div class="flex flex-row flex-wrap gap-2">
        {#each activeFilter.excludeYearMonth as currentYearMonth}
          <Button
            class="whitespace-nowrap"
            size="xs"
            color="light"
            onclick={() =>
              activeFilter.excludeYearMonth &&
              (activeFilter.excludeYearMonth =
                activeFilter.excludeYearMonth.filter(
                  (item) => item !== currentYearMonth,
                ))}
          >
            {currentYearMonth}
          </Button>{/each}
      </div>
    {/if}
  {/if}
  {#if activeFilter.description !== null}
    <TextInput
      bind:value={activeFilter.description}
      name="description"
      title="Description"
      errorMessage=""
    />
  {/if}
  <TextInput
    bind:value={activeFilter.excludeDescription}
    name="excludeDescription"
    title="Exclude Description"
    errorMessage=""
  />
  {#if !hideDates}
    <DateInput
      bind:value={activeFilter.dateAfter}
      name="dateAfter"
      title="Start Date"
      errorMessage=""
    />
    <DateInput
      bind:value={activeFilter.dateBefore}
      name="dateBefore"
      title="End Date"
      errorMessage=""
    />
    {#if activeFilter.dateSpan === undefined}
      <Button
        onclick={() => (activeFilter.dateSpan = "allTime")}
        color="light"
        size="xs"
      >
        Add Date Span
      </Button>
    {:else}
      <div class="flex flex-row gap-2">
        <div class="flex grow">
          <SelectInput
            bind:value={activeFilter.dateSpan}
            title="Fixed Date Span"
            name="dateSpan"
            errorMessage=""
            items={getDateSpanDropdown()}
            wrapperClass="w-full"
          />
        </div>
        <Button
          onclick={() => (activeFilter.dateSpan = undefined)}
          color="light"
          size="sm"
          class="flex self-end"
        >
          Clear
        </Button>
      </div>
    {/if}
  {/if}

  <div class="flex text-sm font-semibold text-black">Transfer</div>
  <BooleanFilterButtons
    onTitle="Transfer"
    offTitle="Not Transfer"
    bind:value={activeFilter.transfer}
  />
  <div class="flex text-sm font-semibold text-black">Status</div>
  <BooleanFilterButtons
    onTitle="Complete"
    offTitle="Incomplete"
    bind:value={activeFilter.complete}
  />
  <div class="flex text-sm font-semibold text-black">Data Checked</div>
  <BooleanFilterButtons
    onTitle="Checked"
    offTitle="Unchecked"
    bind:value={activeFilter.dataChecked}
  />
  <div class="flex text-sm font-semibold text-black">Reconciled</div>
  <BooleanFilterButtons
    onTitle="Reconciled"
    offTitle="Unreconciled"
    bind:value={activeFilter.reconciled}
  />
  <div class="flex text-sm font-semibold text-black">LLM Review Status</div>
  <EnumArraySelection
    bind:values={activeFilter.llmReviewStatus}
    enumSelection={llmReviewStatusEnumSelection}
  />
</div>
