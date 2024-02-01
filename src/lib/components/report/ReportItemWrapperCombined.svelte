<script lang="ts">
	import type { ReportElementDataForUse } from '$lib/server/db/actions/reportActions';
	import ReportElementItem from './contents/ReportElementItem.svelte';
	import ReportItemWrapper from './ReportItemWrapper.svelte';

	type ItemType = ReportElementDataForUse['itemData'][number];

	export let item: ItemType;
	export let itemLinkGenerator: (data: ItemType) => string | undefined = () => undefined;
	export let showLayout: boolean = false;
	export let highlightId: string | undefined = undefined;

	const checkHL = (item: ItemType) => {
		if (highlightId && item) {
			return item.id === highlightId;
		} else {
			return false;
		}
	};
</script>

<ReportItemWrapper
	class={$$props.class}
	href={itemLinkGenerator(item)}
	{showLayout}
	highlight={checkHL(item)}
>
	<ReportElementItem data={item} />
</ReportItemWrapper>
