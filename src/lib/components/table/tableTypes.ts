import type { OrderByType } from '$lib/helpers/orderByHelper';
import type { Writable } from 'svelte/store';

export type tableColumnConfig<
	OrderKeys extends string,
	AllKeys extends string,
	IDs extends string
> = {
	id: IDs;
	title: string;
	key?: AllKeys;
	sortKey?: OrderKeys;
	sortable?: boolean;
	customHeader?: boolean;
};

export type TableColumnsConfig<
	OrderKeys extends string,
	AllKeys extends string,
	IDs extends string
> = tableColumnConfig<OrderKeys, AllKeys, IDs>[];

export type tableCConfigType<
	OrderKeys extends string,
	DataTitles extends string,
	FilterKeys extends string,
	IDs extends string
> = {
	data: Record<DataTitles, unknown>[];
	columns: TableColumnsConfig<OrderKeys, OrderKeys | DataTitles, IDs>;
	currentOrder: OrderByType<OrderKeys>;
	currentFilter: Record<FilterKeys, string | boolean | number>;
	shownColumns: Writable<IDs[]>;
};
