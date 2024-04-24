<script lang="ts">
	import ToggleFromArray from '../ToggleFromArray.svelte';

	import ToggleHeader from '../ToggleHeader.svelte';

	import TableColumnDropdown from './TableColumnDropdown.svelte';

	import OrderDropDown from '../OrderDropDown.svelte';

	import FilterTextDisplay from '../FilterTextDisplay.svelte';

	import DisplayCurrency from '../DisplayCurrency.svelte';

	import {
		Alert,
		Button,
		Dropdown,
		DropdownItem,
		Modal,
		Table,
		TableBody,
		TableBodyCell,
		TableBodyRow,
		TableHead,
		TableHeadCell
	} from 'flowbite-svelte';

	import type { OrderByType } from '$lib/helpers/orderByHelper';

	import type { TableColumnsConfig } from './tableTypes';
	import TablePagination from '../TablePagination.svelte';
	import { filterNullUndefinedAndDuplicates } from '$lib/helpers/filterNullUndefinedAndDuplicates';
	import FilterIcon from '../icons/FilterIcon.svelte';
	import HighlightText from '../HighlightText.svelte';
	import CustomTableHeadCell from './CustomTableHeadCell.svelte';
	import ArrowDownIcon from '../icons/ArrowDownIcon.svelte';

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
					| string
					| boolean
					| number
					| string[]
					| undefined
					| null
					| OrderByType<OrderKeys>
					| Partial<Record<string, any>>
				>
		  >
		| undefined = undefined;
	export let shownColumns: IDs[];
	export let hideTopPagination: boolean = false;
	export let hideBottomPagination: boolean = false;
	export let highlightText: string | null | undefined = '';
	export let highlightTextColumns: IDs[] = [];
	export let rowColour: (row: RowData) => undefined | 'grey' = () => undefined;
	export let bulkSelection: boolean = false;
	export let selectedIds: string[] = [];
	export let rowToId: ((row: RowData) => string) | undefined = undefined;
	const updateSelectedIds = (newValue: string[]) => (selectedIds = newValue);

	export let numberRows: number = 10;
	export let numberRowsOptions: number[] = [10, 25, 50, 100];
	export let onNumberRowsUpdate: (newNumberRows: number) => void = () => {};

	$: sortOptions = filterNullUndefinedAndDuplicates(
		columns.filter((item) => item.sortKey).map((item) => item.sortKey)
	);

	export let filterOpened = false;

	$: visibleIds = filterNullUndefinedAndDuplicates(
		data.map((item) => (rowToId ? rowToId(item) : undefined))
	);

	const updateFilterOpened = (newValue: boolean) => (filterOpened = newValue);
	const columnIdToTitle = (id: string) => columns.find((item) => item.id === id)?.title || id;
	$: allColumnIds = columns.map((item) => item.id);
</script>

{#if paginationInfo && data.length > 0 && !hideTopPagination}
	<div class="flex flex-col items-center gap-2 md:flex-row md:justify-center">
		<TablePagination {...paginationInfo} />
		<Button outline class="flex flex-row items-center gap-2" color="light">
			{numberRows} Rows <ArrowDownIcon />
		</Button>
		<Dropdown>
			{#each numberRowsOptions as option}
				<DropdownItem
					on:click={() => {
						numberRows = option;
						onNumberRowsUpdate(option);
					}}
				>
					{option} Rows
				</DropdownItem>
			{/each}
		</Dropdown>
	</div>
{/if}
<slot name="filter" />

{#if filterText}
	<div class="flex xl:hidden">
		<FilterTextDisplay text={filterText} />
	</div>
{/if}
<div class="flex flex-col items-center gap-2 md:flex-row">
	{#if $$slots.bulkActions}
		<slot name="bulkActions" {selectedIds} {updateSelectedIds} />
	{/if}
	{#if filterText}
		<div class="hidden xl:flex">
			<FilterTextDisplay text={filterText} />
		</div>
	{/if}
	<div class="hidden flex-grow items-center md:flex" />
	<div class="flex flex-row gap-2">
		{#if $$slots.filterModal}
			<Button size="sm" class="flex p-2" color="light" on:click={() => (filterOpened = true)}>
				<FilterIcon />
			</Button>
			<Modal bind:open={filterOpened} size="lg" title={filterModalTitle} outsideclose>
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
</div>

{#if data.length === 0}
	<Alert color="dark">{noneFoundText}</Alert>
{:else}
	<div class="hidden md:flex">
		<Table>
			<TableHead>
				{#if bulkSelection}
					<TableHeadCell class="flex flex-row justify-center gap-1">
						<ToggleHeader bind:selectedIds {visibleIds} onlyVisibleAllowed={true} />
					</TableHeadCell>
				{/if}
				{#each shownColumns as column}
					{@const currentColumn = columns.find((item) => item.id === column)}
					{#if currentColumn}
						<CustomTableHeadCell
							title={currentColumn.title}
							sortKey={currentColumn.sortKey}
							currentSort={currentOrder}
							showDropdown={currentColumn.enableDropdown}
							filterActive={currentColumn.filterActive}
							{onSortURL}
						>
							<svelte:fragment slot="dropdown">
								<slot name="headerItem" {currentColumn} />
							</svelte:fragment>
						</CustomTableHeadCell>
					{/if}
				{/each}
			</TableHead>
			<TableBody>
				{#each data as row}
					{@const thisRowColour = rowColour(row)}
					{@const isGrey = thisRowColour === 'grey'}
					<TableBodyRow class={isGrey ? 'bg-primary-50' : ''}>
						{#if bulkSelection}
							<TableBodyCell>
								<ToggleFromArray id={rowToId ? rowToId(row) : undefined} bind:selectedIds />
							</TableBodyCell>
						{/if}
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
	</div>
	<div class="gap flex flex-col items-stretch md:hidden">
		{#each data as row}
			{@const thisRowColour = rowColour(row)}
			{@const isGrey = thisRowColour === 'grey'}
			<div
				class="flex flex-row gap-2 border-l border-r border-t border-gray-500 p-2 first:rounded-t-lg last:rounded-b-lg last:border-b"
				class:bg-primary-50={isGrey}
			>
				{#if bulkSelection}
					<ToggleFromArray id={rowToId ? rowToId(row) : undefined} bind:selectedIds />
				{/if}
				<div class="flex flex-grow flex-col items-center gap-1 self-stretch">
					{#each shownColumns as column}
						{@const currentColumn = columns.find((item) => item.id === column)}
						<div class="flex">
							{#if currentColumn}
								{#if currentColumn.rowToDisplay}
									<HighlightText
										text={currentColumn.rowToDisplay(row) || ''}
										searchText={highlightText}
										highlight={highlightTextColumns.includes(column)}
									/>
								{:else if currentColumn.rowToCurrency}
									<DisplayCurrency {...currentColumn.rowToCurrency(row)} />
								{:else}
									<slot name="customBodyCell" {currentColumn} {row}>No Content</slot>
								{/if}
							{/if}
						</div>
					{/each}
				</div>
			</div>
		{/each}
	</div>
{/if}
{#if paginationInfo && data.length > 0 && !hideBottomPagination}
	<div class="flex flex-row justify-center">
		<TablePagination {...paginationInfo} />
	</div>
{/if}
