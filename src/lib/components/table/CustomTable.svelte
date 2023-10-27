<script
	lang="ts"
	generics="
	OrderKeys extends string,
	DataTitles extends string,
	FilterKeys extends string,
	IDs extends string"
>
	import type { OrderByType } from '$lib/helpers/orderByHelper';

	import type { TableColumnsConfig } from './tableTypes';
	import RawDataModal from '../RawDataModal.svelte';

	export let data: Record<DataTitles, unknown>[];
	export let columns: TableColumnsConfig<OrderKeys, OrderKeys | DataTitles, IDs>;
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

<RawDataModal {data} buttonText="Data" />
<RawDataModal data={columns} buttonText="Columns" />
<RawDataModal data={currentOrder} buttonText="Current Order" />
<RawDataModal data={currentFilter} buttonText="Current Filter" />
<RawDataModal data={$shownColumns} buttonText="Shown Columns" />
