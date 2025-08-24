<script
	lang="ts"
	generics="OrderKeys extends string, DataTitles extends string, FilterKeys extends string, IDs extends string, RowData extends Record<DataTitles, unknown>"
>
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
	import type { Snippet } from 'svelte';

	import { filterNullUndefinedAndDuplicates } from '$lib/helpers/filterNullUndefinedAndDuplicates';
	import type { OrderByType } from '$lib/helpers/orderByHelper';

	import DisplayCurrency from '../DisplayCurrency.svelte';
	import FilterTextDisplay from '../FilterTextDisplay.svelte';
	import HighlightText from '../HighlightText.svelte';
	import ArrowDownIcon from '../icons/ArrowDownIcon.svelte';
	import FilterIcon from '../icons/FilterIcon.svelte';
	import OrderDropDown from '../OrderDropDown.svelte';
	import TablePagination from '../TablePagination.svelte';
	import ToggleFromArray from '../ToggleFromArray.svelte';
	import ToggleHeader from '../ToggleHeader.svelte';
	import CustomTableHeadCell from './CustomTableHeadCell.svelte';
	import TableColumnDropdown from './TableColumnDropdown.svelte';
	import type { TableColumnsConfig } from './tableTypes';

	type FilterType = Partial<
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
	>;

	let {
		noneFoundText = 'No Items Found',
		data,
		columns,
		currentOrder = undefined,
		paginationInfo,
		onSortURL,
		filterText,
		filterModalTitle = 'Filter',
		currentFilter,
		shownColumns = $bindable(),
		hideTopPagination = false,
		hideBottomPagination = false,
		highlightText = '',
		highlightTextColumns = [],
		rowColour = () => undefined,
		bulkSelection = false,
		selectedIds = $bindable([]),
		rowToId,
		numberRows = $bindable(),
		numberRowsOptions = [10, 25, 50, 100],
		onNumberRowsUpdate = () => {},
		filterOpened = $bindable(),
		slotFilter,
		slotBulkActions,
		slotFilterModal,
		slotFilterButtons,
		slotHeaderItem,
		slotCustomBodyCell
	}: {
		noneFoundText?: string;
		data: RowData[];
		columns: TableColumnsConfig<OrderKeys, RowData, IDs>;
		currentOrder?: OrderByType<OrderKeys> | undefined;
		paginationInfo?: {
			page: number;
			count: number;
			perPage: number;
			buttonCount: number;
			urlForPage: (pageNumber: number) => string;
		};
		onSortURL?: (newSort: OrderByType<OrderKeys>) => string;
		filterText?: string[];
		filterModalTitle?: string;
		currentFilter?: FilterType;
		shownColumns: IDs[];
		hideTopPagination?: boolean;
		hideBottomPagination?: boolean;
		highlightText?: string | null | undefined;
		highlightTextColumns?: IDs[];
		rowColour?: (row: RowData) => undefined | 'grey';
		bulkSelection?: boolean;
		selectedIds?: string[];
		rowToId?: (row: RowData) => string;
		numberRows?: number;
		numberRowsOptions?: number[];
		onNumberRowsUpdate?: (newNumberRows: number) => void;
		filterOpened?: boolean;
		slotFilter?: Snippet;
		slotBulkActions?: Snippet<
			[
				{
					selectedIds: string[];
					updateSelectedIds: (selectedIds: string[]) => string[];
				}
			]
		>;
		slotFilterModal?: Snippet<
			[
				{
					currentFilter: FilterType | undefined;
					filterOpened: boolean;
					updateFilterOpened: (newValue: boolean) => void;
				}
			]
		>;
		slotFilterButtons?: Snippet;
		slotHeaderItem?: Snippet<
			[{ currentColumn: TableColumnsConfig<OrderKeys, RowData, IDs>[number] }]
		>;
		slotCustomBodyCell?: Snippet<
			[
				{
					currentColumn: TableColumnsConfig<OrderKeys, RowData, IDs>[number];
					row: RowData;
				}
			]
		>;
	} = $props();

	const updateSelectedIds = (newValue: string[]) => (selectedIds = newValue);

	const sortOptions = $derived(
		filterNullUndefinedAndDuplicates(
			columns.filter((item) => item.sortKey).map((item) => item.sortKey)
		)
	);

	const visibleIds = $derived(
		filterNullUndefinedAndDuplicates(data.map((item) => (rowToId ? rowToId(item) : undefined)))
	);

	const updateFilterOpened = (newValue: boolean) => (filterOpened = newValue);
	const columnIdToTitle = (id: string) => columns.find((item) => item.id === id)?.title || id;
	const allColumnIds = $derived(columns.map((item) => item.id));
</script>

{#if paginationInfo && data.length > 0 && !hideTopPagination}
	<div class="flex flex-col items-center gap-2 md:flex-row md:justify-center">
		<TablePagination {...paginationInfo} />
		<Button outline class="flex flex-row items-center gap-2" color="light">
			{numberRows} Rows <ArrowDownIcon />
		</Button>
		<Dropdown simple>
			{#each numberRowsOptions as option}
				<DropdownItem
					onclick={() => {
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
{#if slotFilter}{@render slotFilter()}{/if}

{#if filterText}
	<div class="flex xl:hidden">
		<FilterTextDisplay text={filterText} />
	</div>
{/if}
<div class="flex flex-col items-center gap-2 md:flex-row">
	{#if slotBulkActions}
		{@render slotBulkActions({ selectedIds, updateSelectedIds })}
	{/if}
	{#if filterText}
		<div class="hidden xl:flex">
			<FilterTextDisplay text={filterText} />
		</div>
	{/if}
	<div class="hidden grow items-center md:flex"></div>
	<div class="flex flex-row gap-2">
		{#if slotFilterModal}
			<Button size="sm" class="flex p-2" color="light" onclick={() => (filterOpened = true)}>
				<FilterIcon />
			</Button>
			<Modal bind:open={filterOpened} size="lg" title={filterModalTitle} outsideclose>
				{#if filterOpened}
					{@render slotFilterModal({
						currentFilter,
						filterOpened,
						updateFilterOpened
					})}
				{/if}
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
		{#if slotFilterButtons}
			{@render slotFilterButtons()}
		{/if}
	</div>
</div>

{#if data.length === 0}
	<Alert color="secondary">{noneFoundText}</Alert>
{:else}
	<div class="hidden md:block">
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
							{#snippet slotDropdown()}
								{#if slotHeaderItem}
									{@render slotHeaderItem({ currentColumn })}
								{/if}
							{/snippet}
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
										{#if slotCustomBodyCell}
											{@render slotCustomBodyCell({ currentColumn, row })}
										{:else}
											No Content
										{/if}
									</TableBodyCell>
								{/if}
							{/if}
						{/each}
					</TableBodyRow>
				{/each}
			</TableBody>
		</Table>
	</div>
	<div class="flex flex-col items-stretch gap-2 md:hidden">
		{#if bulkSelection}
			<div class="flex px-4">
				<ToggleHeader bind:selectedIds {visibleIds} onlyVisibleAllowed={true} />
				Selection
			</div>
		{/if}
		<div class="flex flex-col items-stretch">
			{#each data as row}
				{@const thisRowColour = rowColour(row)}
				{@const isGrey = thisRowColour === 'grey'}
				<div
					class="flex flex-col border-t border-r border-l border-gray-500 p-2 first:rounded-t-lg last:rounded-b-lg last:border-b"
					class:bg-primary-50={isGrey}
				>
					{#if bulkSelection}
						<div class="text-primary-400 flex flex-row gap-2 self-start p-2">
							<ToggleFromArray id={rowToId ? rowToId(row) : undefined} bind:selectedIds />
							Selected
						</div>
					{/if}
					<div class="flex grow flex-col items-center gap-1 self-stretch">
						{#each shownColumns as column}
							{@const currentColumn = columns.find((item) => item.id === column)}
							<div class="flex flex-row items-center gap-2">
								{#if currentColumn}
									{#if currentColumn.showTitleOnMobile}
										<div class="text-primary-400 flex">
											{currentColumn.title} :
										</div>
									{/if}
									{#if currentColumn.rowToDisplay}
										<HighlightText
											text={currentColumn.rowToDisplay(row) || ''}
											searchText={highlightText}
											highlight={highlightTextColumns.includes(column)}
										/>
									{:else if currentColumn.rowToCurrency}
										<DisplayCurrency {...currentColumn.rowToCurrency(row)} />
									{:else if slotCustomBodyCell}
										{@render slotCustomBodyCell({ currentColumn, row })}
									{:else}
										No Content
									{/if}
								{/if}
							</div>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	</div>
{/if}
{#if paginationInfo && data.length > 0 && !hideBottomPagination}
	<div class="flex flex-row justify-center">
		<TablePagination {...paginationInfo} />
	</div>
{/if}
