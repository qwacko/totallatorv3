<script lang="ts">
	import { is } from 'drizzle-orm';

	import { Button, Dropdown, DropdownItem, P, TableHeadCell } from 'flowbite-svelte';
	import SortIcon from '../SortIcon.svelte';
	import DeleteIcon from '../icons/DeleteIcon.svelte';
	import type { OrderByType } from '$lib/helpers/orderByHelper';

	type OrderKeys = $$Generic<string>;

	export let title: string;
	export let currentSort: OrderByType<OrderKeys> | undefined = undefined;
	export let sortKey: OrderKeys | undefined = undefined;
	export let onSortURL: ((newSort: OrderByType<OrderKeys>) => string) | undefined = undefined;

	$: showDropdown = sortKey !== undefined;

	$: isAscending = currentSort?.find((sort) => sort.field === sortKey)?.direction === 'asc';
	$: isDescending = currentSort?.find((sort) => sort.field === sortKey)?.direction === 'desc';
	$: isNone = currentSort?.find((sort) => sort.field === sortKey) === undefined;

	$: setAscendingURL = (): string => {
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
	};

	$: setDescendingURL = (): string => {
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
	};

	$: setNoneURL = (): string => {
		if (!onSortURL || !sortKey) return '';
		if (currentSort) {
			return onSortURL(currentSort.filter((sort) => sort.field !== sortKey));
		}

		return '';
	};

	let opened = false;
</script>

<TableHeadCell class="{showDropdown ? 'hover:cursor-pointer hover:bg-primary-200' : ''} p-0">
	{#if showDropdown}
		<button class="w-full h-full p-4">
			<P size="xs" weight="bold" class="text-primary-600" space="tight">{title.toUpperCase()}</P>
		</button>
	{:else}
		<P size="xs" weight="bold" class="text-primary-600 p-4" space="tight">{title.toUpperCase()}</P>
	{/if}
	{#if showDropdown}
		<Dropdown bind:open={opened}>
			<DropdownItem class="flex flex-row gap-2 items-center">
				<div class="flex flex-grow pr-4">Sorting</div>
				<Button
					data-sveltekit-noscroll
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
					href={setNoneURL()}
					size="sm"
					outline={!isNone}
					disabled={isNone}
					class="p-1"
				>
					<DeleteIcon />
				</Button>
			</DropdownItem>
		</Dropdown>
	{/if}
</TableHeadCell>
