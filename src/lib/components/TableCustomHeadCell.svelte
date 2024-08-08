<script lang="ts" generics="Options extends string">
	import { getOrderBy, modifyOrderBy, type OrderByType } from '$lib/helpers/orderByHelper';
	import { Button, TableHeadCell } from 'flowbite-svelte';
	import SortIcon from './SortIcon.svelte';

	const {
		currentOrder,
		orderKey,
		updateOrderByToURL,
		title
	}: {
		currentOrder: OrderByType<Options> | undefined;
		orderKey: Options;
		updateOrderByToURL: (newOrder: OrderByType<Options>) => string;
		title: string;
	} = $props();
</script>

<TableHeadCell>
	<div class="flex flex-row items-center gap-2">
		<div class="flex">{title}</div>
		<div class="flex">
			<Button
				href={updateOrderByToURL(modifyOrderBy(currentOrder, orderKey))}
				class="border-0 p-1"
				outline
				data-sveltekit-noscroll
			>
				<SortIcon direction={getOrderBy(currentOrder, orderKey)} />
			</Button>
		</div>
	</div>
</TableHeadCell>
