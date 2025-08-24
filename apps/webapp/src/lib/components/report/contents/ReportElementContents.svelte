<script lang="ts">
	import type { ReportElementDataForUse } from '@totallator/business-logic';

	import ReportItemWrapperCombined from '../ReportItemWrapperCombined.svelte';

	const {
		data,
		itemLinkGenerator = () => undefined,
		showLayout = false,
		highlightId = undefined
	}: {
		data: ReportElementDataForUse;
		itemLinkGenerator?: (data: ReportElementDataForUse['itemData'][number]) => string | undefined;
		showLayout?: boolean;
		highlightId?: string | undefined;
	} = $props();

	const items = $derived(data.itemData.sort((a, b) => (a?.order || 30) - (b?.order || 30)));
	const layout = $derived(data.elementConfig.reportElementConfig.layout);
</script>

{#if layout === 'singleItem'}
	<div class="flex h-full w-full items-stretch">
		<ReportItemWrapperCombined
			class="flex grow"
			item={items[0]}
			{itemLinkGenerator}
			{showLayout}
			{highlightId}
		/>
	</div>
{:else if layout === 'twoItemsHorizontal' || layout === 'twoItemsVertical'}
	<div
		class="flex h-full w-full items-stretch gap-1"
		class:flex-row={layout === 'twoItemsHorizontal'}
		class:flex-col={layout === 'twoItemsVertical'}
	>
		<ReportItemWrapperCombined
			class="flex grow basis-0"
			item={items[0]}
			{itemLinkGenerator}
			{showLayout}
			{highlightId}
		/>
		<ReportItemWrapperCombined
			class="flex grow basis-0"
			item={items[1]}
			{itemLinkGenerator}
			{showLayout}
			{highlightId}
		/>
	</div>
{:else if layout === 'twoSmallOneLargeHorizontal' || layout === 'twoSmallOneLargeVertical'}
	<div
		class="flex h-full w-full items-stretch gap-1"
		class:flex-row={layout === 'twoSmallOneLargeHorizontal'}
		class:flex-col={layout === 'twoSmallOneLargeVertical'}
	>
		<div
			class="flex justify-between"
			class:flex-col={layout === 'twoSmallOneLargeHorizontal'}
			class:flex-row={layout === 'twoSmallOneLargeVertical'}
		>
			<ReportItemWrapperCombined
				class="flex"
				item={items[0]}
				{itemLinkGenerator}
				{showLayout}
				{highlightId}
			/>

			<ReportItemWrapperCombined
				class="flex"
				item={items[1]}
				{itemLinkGenerator}
				{showLayout}
				{highlightId}
			/>
		</div>
		<ReportItemWrapperCombined
			class="flex grow"
			item={items[2]}
			{itemLinkGenerator}
			{showLayout}
			{highlightId}
		/>
	</div>
{/if}
