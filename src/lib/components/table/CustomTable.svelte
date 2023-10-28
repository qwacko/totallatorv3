<script lang="ts">
	import TableColumnDropdown from './TableColumnDropdown.svelte';

	import OrderDropDown from '../OrderDropDown.svelte';

	import FilterTextDisplay from '../FilterTextDisplay.svelte';

	import DisplayCurrency from '../DisplayCurrency.svelte';

	import {
		Alert,
		Button,
		Modal,
		Table,
		TableBody,
		TableBodyCell,
		TableBodyRow,
		TableHead
	} from 'flowbite-svelte';

	import type { OrderByType } from '$lib/helpers/orderByHelper';

	import type { TableColumnsConfig } from './tableTypes';
	import TablePagination from '../TablePagination.svelte';
	import { filterNullUndefinedAndDuplicates } from '../../../routes/(loggedIn)/journals/filterNullUndefinedAndDuplicates';
	import FilterIcon from '../icons/FilterIcon.svelte';
	import HighlightText from '../HighlightText.svelte';
	import CustomTableHeadCell from './CustomTableHeadCell.svelte';

	type OrderKeys = $$Generic<string>;
	type DataTitles = $$Generic<string>;
	type FilterKeys = $$Generic<string>;
	type IDs = $$Generic<string>;
	type RowData = $$Generic<Record<DataTitles, unknown>>;

	export let noneFoundText = 'No Items Found';
	export let data: RowData[];
	export let columns: TableColumnsConfig<OrderKeys, RowData, IDs>;
	export let currentOrder: OrderByType<OrderKeys> | undefined = undefined;
	export let paginationInfo:
		| {
				page: number;
				count: number;
				perPage: number;
				buttonCount: number;
				urlForPage: (pageNumber: number) => string;
		  }
		| undefined = undefined;
	export let onSortURL: ((newSort: OrderByType<OrderKeys>) => string) | undefined = undefined;

	export let filterText: string[] | undefined = undefined;
	export let filterModalTitle = 'Filter';

	export let currentFilter:
		| Partial<
				Record<
					FilterKeys,
					string | boolean | number | string[] | undefined | OrderByType<OrderKeys>
				>
		  >
		| undefined = undefined;
	export let shownColumns: IDs[];
	export let hideTopPagination: boolean = false;
	export let hideBottomPagination: boolean = false;
	export let highlightText: string = '';
	export let highlightTextColumns: IDs[] = [];

	$: sortOptions = filterNullUndefinedAndDuplicates(
		columns.filter((item) => item.sortKey).map((item) => item.sortKey)
	);
	$: console.log('Sort Options : ', sortOptions);

	let filterOpened = false;

	const updateFilterOpened = (newValue: boolean) => (filterOpened = newValue);
	const columnIdToTitle = (id: string) => columns.find((item) => item.id === id)?.title || id;
	$: allColumnIds = columns.map((item) => item.id);
</script>

<!-- <RawDataModal {data} buttonText="Data" dev={true} />
<RawDataModal data={columns} buttonText="Columns" dev={true} />
<RawDataModal data={currentOrder} buttonText="Current Order" dev={true} />
<RawDataModal data={currentFilter} buttonText="Current Filter" dev={true} />
<RawDataModal data={shownColumns} buttonText="Shown Columns" dev={true} /> -->
{#if paginationInfo && data.length > 0 && !hideTopPagination}
	<div class="flex flex-row justify-center">
		<TablePagination {...paginationInfo} />
	</div>
{/if}
<slot name="filter" />
<div class="flex flex-row gap-2">
	{#if filterText}
		<FilterTextDisplay text={filterText} />
	{/if}
	<div class="flex flex-grow items-center" />
	{#if $$slots.filterModal}
		<Button size="sm" class="p-2 flex" color="light" on:click={() => (filterOpened = true)}>
			<FilterIcon />
		</Button>
		<Modal bind:open={filterOpened} size="lg" title={filterModalTitle}>
			<slot name="filterModal" {currentFilter} {filterOpened} {updateFilterOpened} />
		</Modal>
	{/if}

	{#if onSortURL && sortOptions.length > 0}
		<OrderDropDown
			currentSort={currentOrder}
			options={sortOptions}
			{onSortURL}
			optionToTitle={(option) => columns.find((item) => item.sortKey === option)?.title || ''}
		/>
	{/if}
	<TableColumnDropdown bind:shownColumns {columnIdToTitle} columnIds={allColumnIds} />
	<slot name="filterButtons" />
</div>

{#if data.length === 0}
	<Alert color="dark">{noneFoundText}</Alert>
{:else}
	<Table>
		<TableHead>
			{#each shownColumns as column}
				{@const currentColumn = columns.find((item) => item.id === column)}
				{#if currentColumn}
					<CustomTableHeadCell
						title={currentColumn.title}
						sortKey={currentColumn.sortKey}
						currentSort={currentOrder}
						{onSortURL}
					/>
				{/if}
			{/each}
		</TableHead>
		<TableBody>
			{#each data as row}
				<TableBodyRow>
					{#each shownColumns as column}
						{@const currentColumn = columns.find((item) => item.id === column)}
						{#if currentColumn}
							{#if currentColumn.rowToDisplay}
								<TableBodyCell>
									<HighlightText
										text={currentColumn.rowToDisplay(row) || ''}
										searchText={highlightText}
										highlight={highlightTextColumns.includes(column)}
									/>
								</TableBodyCell>
							{:else if currentColumn.rowToCurrency}
								<TableBodyCell>
									<DisplayCurrency {...currentColumn.rowToCurrency(row)} />
								</TableBodyCell>
							{:else}
								<TableBodyCell>
									<slot name="customBodyCell" {currentColumn} {row}>No Content</slot>
								</TableBodyCell>
							{/if}
						{/if}
					{/each}
				</TableBodyRow>
			{/each}
		</TableBody>
	</Table>
{/if}
{#if paginationInfo && data.length > 0 && !hideBottomPagination}
	<div class="flex flex-row justify-center">
		<TablePagination {...paginationInfo} />
	</div>
{/if}
