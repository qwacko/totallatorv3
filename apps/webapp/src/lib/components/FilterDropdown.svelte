<script lang="ts">
  import {
    Button,
    Dropdown,
    DropdownDivider,
    DropdownItem,
  } from "flowbite-svelte";

  import type { ReusableFilterDropdownListType } from "@totallator/business-logic";
  import {
    defaultAllJournalFilter,
    defaultJournalFilter,
    type JournalFilterSchemaType,
  } from "@totallator/shared";

  import ArrowRightIcon from "$lib/components/icons/ArrowRightIcon.svelte";
  import FilterMenuIcon from "$lib/components/icons/FilterMenuIcon.svelte";
  import FilterModifyIcon from "$lib/components/icons/FilterModifyIcon.svelte";
  import FilterReplaceIcon from "$lib/components/icons/FilterReplaceIcon.svelte";
  import { urlGenerator } from "$lib/routes";

  const {
    filters,
    updateFilter,
    newFilter,
    currentFilter,
    hideIcon = false,
    showDefaultJournalFilters = false,
    buttonText,
    hideButton,
    placement,
  }: {
    filters: ReusableFilterDropdownListType;
    updateFilter: (filter: JournalFilterSchemaType) => string;
    newFilter: (filter: JournalFilterSchemaType) => string;
    currentFilter: JournalFilterSchemaType;
    hideIcon?: boolean;
    showDefaultJournalFilters?: boolean;
    buttonText?: string;
    hideButton?: boolean;
    placement?:
      | "top"
      | "top-start"
      | "top-end"
      | "right"
      | "right-start"
      | "right-end"
      | "bottom"
      | "bottom-start"
      | "bottom-end"
      | "left"
      | "left-start"
      | "left-end";
  } = $props();

  const filterKeys = $derived(
    Object.keys(filters).sort((a, b) => a.localeCompare(b)),
  );

  const filterToURL = (
    filter: Pick<
      ReusableFilterDropdownListType[string][number],
      "filter" | "modificationType"
    >,
  ) => {
    if (filter.modificationType === "modify") {
      return updateFilter(filter.filter);
    }
    return newFilter(filter.filter);
  };
</script>

{#if !hideButton}
  <Button class="p-2" outline>
    {#if buttonText}{buttonText}{:else}<FilterMenuIcon />{/if}
  </Button>
{/if}
<Dropdown {placement} simple>
  {#if showDefaultJournalFilters}
    <DropdownItem
      href={filterToURL({
        filter: defaultAllJournalFilter(),
        modificationType: "replace",
      })}
      classes={{ anchor: "flex flex-row gap-2" }}
    >
      All
    </DropdownItem>
    <DropdownItem
      href={filterToURL({
        filter: defaultJournalFilter(),
        modificationType: "replace",
      })}
      classes={{ anchor: "flex flex-row gap-2" }}
    >
      Assets / Liabilities
    </DropdownItem>
  {/if}
  {#each filterKeys as filterKey}
    {@const currentFilter = filters[filterKey].sort((a, b) =>
      a.title.localeCompare(b.title),
    )}
    {#if currentFilter.length === 1}
      {@const filter = currentFilter[0]}
      <DropdownItem
        href={filterToURL(filter)}
        classes={{ anchor: "flex flex-row gap-2" }}
      >
        {#if !hideIcon}
          {#if filter.modificationType === "modify"}
            <FilterModifyIcon />
          {:else}
            <FilterReplaceIcon />
          {/if}
        {/if}
        {filter.group ? `${filter.group} : ` : ""}{filter.title}
      </DropdownItem>
    {:else}
      <DropdownItem
        classes={{ anchor: "flex items-center justify-between gap-2" }}
      >
        {filterKey}<ArrowRightIcon />
      </DropdownItem>
      <Dropdown simple>
        {#each currentFilter as filter}
          <DropdownItem
            href={filterToURL(filter)}
            classes={{ anchor: "flex flex-row gap-2" }}
          >
            {#if !hideIcon}
              {#if filter.modificationType === "modify"}
                <FilterModifyIcon />
              {:else}
                <FilterReplaceIcon />
              {/if}
            {/if}
            {filter.title}
          </DropdownItem>
        {/each}
      </Dropdown>
    {/if}
  {/each}
  {#if filterKeys.length > 0}
    <DropdownDivider />
  {/if}
  <DropdownItem
    href={urlGenerator({
      address: "/(loggedIn)/filters/create",
      searchParamsValue: { filter: currentFilter },
    }).url}
  >
    Create New Reusable Filter
  </DropdownItem>
</Dropdown>
