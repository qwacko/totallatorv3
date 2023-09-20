<script lang="ts">
	import DeleteIcon from './icons/DeleteIcon.svelte';

	import SortIcon from './SortIcon.svelte';

	import SortingIcon from '$lib/components/icons/SortingIcon.svelte';
	import { modifyOrderBy, type OrderByType } from '$lib/helpers/orderByHelper';
	import { Button, Dropdown, DropdownDivider, DropdownItem } from 'flowbite-svelte';

	type T = $$Generic<string>;

	export let options: T[];
	export let optionToTitle: (option: T) => string;
	export let currentSort: OrderByType<T> | undefined;
	export let onSortURL: (sort: OrderByType<T>) => string;

	$: sortKeys = currentSort ? currentSort.map((sort) => sort.field) : [];
	$: remainingSort = options.filter((option) => !sortKeys.includes(option));
</script>

<Button outline class="flex p-2"><SortingIcon /></Button>
<Dropdown>
	{#each currentSort || [] as sort}
		<DropdownItem
			href={onSortURL(modifyOrderBy(currentSort, sort.field, 'toggleOnly'))}
			data-sveltekit-keepfocus
			class="flex flex-row flex-nowrap  gap-2 items-center"
			id="dropdown-item{sort.field}"
		>
			<SortIcon direction={sort.direction} />
			<div class="flex whitespace-nowrap flex-grow">{optionToTitle(sort.field)}</div>
			<Button
				color="none"
				href={onSortURL(modifyOrderBy(currentSort, sort.field, 'remove'))}
				class="p-2"
			>
				<DeleteIcon />
			</Button>
		</DropdownItem>
	{/each}
	<DropdownDivider />
	{#each remainingSort as sort}
		<DropdownItem
			href={onSortURL(modifyOrderBy(currentSort, sort, 'add'))}
			data-sveltekit-keepfocus
			id="dropdown-item{sort}"
			class="flex flex-row flex-nowrap gap-2 items-center"
		>
			<div class="flex whitespace-nowrap">{optionToTitle(sort)}</div>
		</DropdownItem>
	{/each}
</Dropdown>
