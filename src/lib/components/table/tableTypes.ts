import type { OrderByType } from '$lib/helpers/orderByHelper';
import type { Writable } from 'svelte/store';

export type tableColumnConfig<
	OrderKeys extends string,
	IDs extends string,
	RowData extends Record<string, unknown>
> = {
	id: IDs;
	title: string;
	rowToDisplay?: (row: RowData) => string | null | undefined;
	rowToCurrency?: (row: RowData) => { amount: number | undefined };
	sortKey?: OrderKeys;
	enableDropdown?: boolean;
	filterActive?: boolean;
	customHeader?: boolean;
	customCell?: boolean;
	showTitleOnMobile?: boolean;
};

export type TableColumnsConfig<
	OrderKeys extends string,
	RowData extends Record<string, unknown>,
	IDs extends string
> = tableColumnConfig<OrderKeys, IDs, RowData>[];

export type tableCConfigType<
	OrderKeys extends string,
	DataTitles extends string,
	FilterKeys extends string,
	IDs extends string
> = {
	data: Record<DataTitles, unknown>[];
	columns: TableColumnsConfig<OrderKeys, Record<DataTitles, unknown>, IDs>;
	currentOrder: OrderByType<OrderKeys>;
	currentFilter: Record<FilterKeys, string | boolean | number>;
	shownColumns: Writable<IDs[]>;
};
