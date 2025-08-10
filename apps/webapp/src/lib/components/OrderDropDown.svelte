<script lang="ts" generics="T extends string">
  import {
    Button,
    Dropdown,
    DropdownDivider,
    DropdownItem,
  } from "flowbite-svelte";

  import SortingIcon from "$lib/components/icons/SortingIcon.svelte";
  import { modifyOrderBy, type OrderByType } from "$lib/helpers/orderByHelper";

  import DeleteIcon from "./icons/DeleteIcon.svelte";
  import SortIcon from "./SortIcon.svelte";

  const {
    options,
    optionToTitle,
    currentSort,
    onSortURL,
  }: {
    options: T[];
    optionToTitle: (option: T) => string;
    currentSort: OrderByType<T> | undefined;
    onSortURL: (sort: OrderByType<T>) => string;
  } = $props();

  const sortKeys = $derived(
    currentSort ? currentSort.map((sort) => sort.field) : [],
  );
  const remainingSort = $derived(
    options.filter((option) => !sortKeys.includes(option)),
  );
</script>

<Button outline class="flex p-2"><SortingIcon /></Button>
<Dropdown simple>
  {#each currentSort || [] as sort}
    <DropdownItem
      href={onSortURL(modifyOrderBy(currentSort, sort.field, "toggleOnly"))}
      data-sveltekit-keepfocus
      class="flex flex-row flex-nowrap  items-center gap-2"
      id="dropdown-item{sort.field}"
    >
      <SortIcon direction={sort.direction} />
      <div class="flex grow whitespace-nowrap">{optionToTitle(sort.field)}</div>
      <Button
        href={onSortURL(modifyOrderBy(currentSort, sort.field, "remove"))}
        class="p-2"
      >
        <DeleteIcon />
      </Button>
    </DropdownItem>
  {/each}
  <DropdownDivider />
  {#each remainingSort as sort}
    <DropdownItem
      href={onSortURL(modifyOrderBy(currentSort, sort, "add"))}
      data-sveltekit-keepfocus
      id="dropdown-item{sort}"
      class="flex flex-row flex-nowrap items-center gap-2"
    >
      <div class="flex whitespace-nowrap">{optionToTitle(sort)}</div>
    </DropdownItem>
  {/each}
</Dropdown>
