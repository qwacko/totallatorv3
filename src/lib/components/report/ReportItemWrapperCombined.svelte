<script lang="ts">
	import type { ReportElementDataForUse } from '$lib/server/db/actions/reportActions';
	import ReportElementItem from './contents/ReportElementItem.svelte';
	import ReportItemWrapper from './ReportItemWrapper.svelte';

	type ItemType = ReportElementDataForUse['itemData'][number];

	const {
		item,
		itemLinkGenerator = () => undefined,
		showLayout = false,
		highlightId = undefined,
		class: className = undefined
	}: {
		item: ItemType;
		itemLinkGenerator?: (data: ItemType) => string | undefined;
		showLayout?: boolean;
		highlightId?: string | undefined;
		class?: string;
	} = $props();


	const checkHL = (item: ItemType) => {
		if (highlightId && item) {
			return item.id === highlightId;
		} else {
			return false;
		}
	};
</script>

<ReportItemWrapper
	class={className}
	href={itemLinkGenerator(item)}
	{showLayout}
	highlight={checkHL(item)}
>
	<ReportElementItem data={item} />
</ReportItemWrapper>
