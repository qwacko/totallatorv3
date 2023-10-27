<script lang="ts">
	import DisplayCurrency from '../DisplayCurrency.svelte';

	import {
		Table,
		TableBody,
		TableBodyCell,
		TableBodyRow,
		TableHead,
		TableHeadCell
	} from 'flowbite-svelte';

	import type { OrderByType } from '$lib/helpers/orderByHelper';

	import type { TableColumnsConfig } from './tableTypes';
	import RawDataModal from '../RawDataModal.svelte';

	type OrderKeys = $$Generic<string>;
	type DataTitles = $$Generic<string>;
	type FilterKeys = $$Generic<string>;
	type IDs = $$Generic<string>;
	type RowData = $$Generic<Record<DataTitles, unknown>>;

	export let data: RowData[];
	export let columns: TableColumnsConfig<OrderKeys, RowData, IDs>;
	export let currentOrder: OrderByType<OrderKeys> | undefined = undefined;
	export let currentFilter:
		| Partial<
				Record<
					FilterKeys,
					string | boolean | number | string[] | undefined | OrderByType<OrderKeys>
				>
		  >
		| undefined = undefined;
	export let shownColumns: IDs[];
</script>

<RawDataModal {data} buttonText="Data" dev={true} />
<RawDataModal data={columns} buttonText="Columns" dev={true} />
<RawDataModal data={currentOrder} buttonText="Current Order" dev={true} />
<RawDataModal data={currentFilter} buttonText="Current Filter" dev={true} />
<RawDataModal data={shownColumns} buttonText="Shown Columns" dev={true} />

<Table>
	<TableHead>
		{#each shownColumns as column}
			{@const currentColumn = columns.find((item) => item.id === column)}
			{#if currentColumn}
				<TableHeadCell>{currentColumn.title}</TableHeadCell>
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
								{currentColumn.rowToDisplay(row) || ''}
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
