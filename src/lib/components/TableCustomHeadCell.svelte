<script lang="ts" generics="Options extends string">
	import { getOrderBy, modifyOrderBy, type OrderByType } from '$lib/helpers/orderByHelper';
	import { Button, TableHeadCell } from 'flowbite-svelte';
	import SortIcon from './SortIcon.svelte';

	export let currentOrder: OrderByType<Options> | undefined;
	export let orderKey: Options;
	export let updateOrderByToURL: (newOrder: OrderByType<Options>) => string;
	export let title: string;
</script>

<TableHeadCell>
	<div class="flex flex-row gap-2 items-center">
		<div class="flex">{title}</div>
		<div class="flex">
			<Button
				href={updateOrderByToURL(modifyOrderBy(currentOrder, orderKey))}
				class="p-1 border-0"
				outline
				data-sveltekit-noscroll
			>
				<SortIcon direction={getOrderBy(currentOrder, orderKey)} />
			</Button>
		</div>
	</div>
</TableHeadCell>
