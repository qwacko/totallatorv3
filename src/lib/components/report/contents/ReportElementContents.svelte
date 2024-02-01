<script lang="ts">
	import type { ReportElementDataForUse } from '$lib/server/db/actions/reportActions';
	import ReportItemWrapperCombined from '../ReportItemWrapperCombined.svelte';

	export let data: ReportElementDataForUse;
	export let itemLinkGenerator: (
		data: ReportElementDataForUse['itemData'][number]
	) => string | undefined = () => undefined;
	export let showLayout: boolean = false;
	export let highlightId: string | undefined = undefined;

	$: items = data.itemData.sort((a, b) => (a?.order || 30) - (b?.order || 30));
	$: layout = data.elementConfig.reportElementConfig.layout;
</script>

{#if layout === 'singleItem'}
	<ReportItemWrapperCombined
		class="h-full w-full"
		item={items[0]}
		{itemLinkGenerator}
		{showLayout}
		{highlightId}
	/>
{:else if layout === 'twoItemsHorizontal' || layout === 'twoItemsVertical'}
	<div
		class="flex h-full w-full items-stretch gap-1"
		class:flex-row={layout === 'twoItemsHorizontal'}
		class:flex-col={layout === 'twoItemsVertical'}
	>
		<ReportItemWrapperCombined
			class="flex flex-grow basis-0"
			item={items[0]}
			{itemLinkGenerator}
			{showLayout}
			{highlightId}
		/>
		<ReportItemWrapperCombined
			class="flex flex-grow basis-0"
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
			class="flex flex-grow"
			item={items[2]}
			{itemLinkGenerator}
			{showLayout}
			{highlightId}
		/>
	</div>
{/if}
