<script lang="ts" generics="OrderKeys extends string">
	import { Button, Dropdown, DropdownItem, P, TableHeadCell } from 'flowbite-svelte';
	import type { Snippet } from 'svelte';

	import type { OrderByType } from '$lib/helpers/orderByHelper';

	import DeleteIcon from '../icons/DeleteIcon.svelte';
	import FilterIcon from '../icons/FilterIcon.svelte';
	import SortIcon from '../SortIcon.svelte';

	const {
		title,
		currentSort = undefined,
		sortKey = undefined,
		onSortURL = undefined,
		showDropdown = false,
		filterActive = undefined,
		slotDropdown
	}: {
		title: string;
		currentSort?: OrderByType<OrderKeys> | undefined;
		sortKey?: OrderKeys | undefined;
		onSortURL?: ((newSort: OrderByType<OrderKeys>) => string) | undefined;
		showDropdown?: boolean;
		filterActive?: boolean | undefined;
		slotDropdown?: Snippet;
	} = $props();

	const showDropdownCalculated = $derived(sortKey !== undefined || showDropdown);

	const isAscending = $derived(
		currentSort?.find((sort) => sort.field === sortKey)?.direction === 'asc'
	);
	const isDescending = $derived(
		currentSort?.find((sort) => sort.field === sortKey)?.direction === 'desc'
	);
	const isNone = $derived(currentSort?.find((sort) => sort.field === sortKey) === undefined);

	const setAscendingURL = $derived((): string => {
		if (!onSortURL || !sortKey) return '';
		if (currentSort) {
			if (isNone) {
				return onSortURL([...currentSort, { field: sortKey, direction: 'asc' }]);
			}
			if (isDescending) {
				return onSortURL(
					currentSort.map((sort) =>
						sort.field === sortKey ? { field: sortKey, direction: 'asc' } : sort
					)
				);
			}
		} else {
			return onSortURL([{ field: sortKey, direction: 'asc' }]);
		}

		return '';
	});

	const setDescendingURL = $derived((): string => {
		if (!onSortURL || !sortKey) return '';
		if (currentSort) {
			if (isNone) {
				return onSortURL([...currentSort, { field: sortKey, direction: 'desc' }]);
			}
			if (isAscending) {
				return onSortURL(
					currentSort.map((sort) =>
						sort.field === sortKey ? { field: sortKey, direction: 'desc' } : sort
					)
				);
			}
		} else {
			return onSortURL([{ field: sortKey, direction: 'desc' }]);
		}

		return '';
	});

	const setNoneURL = $derived((): string => {
		if (!onSortURL || !sortKey) return '';
		if (currentSort) {
			return onSortURL(currentSort.filter((sort) => sort.field !== sortKey));
		}

		return '';
	});

	let opened = $state(false);
</script>

<TableHeadCell
	class="{showDropdownCalculated ? 'hover:bg-primary-200 hover:cursor-pointer' : ''} p-0"
>
	<button class="flex h-full w-full items-center gap-2 p-4">
		<P size="xs" weight="bold" class="text-primary-600  " space="tight">
			{title.toUpperCase()}
		</P>
		{#if isAscending}
			<SortIcon direction="asc" />
		{/if}
		{#if isDescending}
			<SortIcon direction="desc" />
		{/if}
		{#if filterActive}
			<FilterIcon />
		{/if}
	</button>
	{#if showDropdownCalculated}
		<Dropdown bind:isOpen={opened} simple>
			{#if sortKey !== undefined}
				<DropdownItem class="flex flex-row items-center gap-2">
					<div class="flex grow pr-4">Sorting</div>
					<Button
						data-sveltekit-noscroll
						data-sveltekit-keepfocus
						href={setAscendingURL()}
						size="sm"
						outline={!isAscending}
						disabled={isAscending}
						class="p-1"
					>
						<SortIcon direction="asc" />
					</Button>
					<Button
						data-sveltekit-noscroll
						data-sveltekit-keepfocus
						href={setDescendingURL()}
						size="sm"
						outline={!isDescending}
						disabled={isDescending}
						class="p-1"
					>
						<SortIcon direction="desc" />
					</Button>
					<Button
						data-sveltekit-noscroll
						data-sveltekit-keepfocus
						href={setNoneURL()}
						size="sm"
						outline={!isNone}
						disabled={isNone}
						class="p-1"
					>
						<DeleteIcon />
					</Button>
				</DropdownItem>
			{/if}
			{#if slotDropdown}{@render slotDropdown()}{/if}
		</Dropdown>
	{/if}
</TableHeadCell>
