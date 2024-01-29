<script lang="ts">
	import DisplayCurrency from '$lib/components/DisplayCurrency.svelte';
	import { displayTimeOptionsData } from '$lib/schema/reportHelpers/displayTimeOptionsEnum';
	import type { ReportElementNumberData } from '$lib/server/db/actions/helpers/report/getData';
	import { Spinner } from 'flowbite-svelte';
	import ReportElementSparkline from './ReportElementSparkline.svelte';
	import { displaySparklineOptionsData } from '$lib/schema/reportHelpers/displaySparklineOptionsEnum';

	export let data: ReportElementNumberData;

	$: primaryDisplay = displayTimeOptionsData[data.numberDisplay];
	$: secondaryDisplay = displayTimeOptionsData[data.numberSecondaryDisplay];
	$: sparklineOptions = displaySparklineOptionsData[data.numberSparkline];
	$: vertical = data.numberVertical;
	$: textSize = data.numberSize;
</script>

{#await data.data}
	<Spinner />
{:then currentData}
	<div
		class="flex h-full w-full items-stretch justify-center gap-2"
		class:flex-row={!vertical}
		class:flex-col={vertical}
	>
		<div
			class="flex gap-2"
			class:pl-6={!vertical}
			class:items-center={vertical}
			class:items-end={!vertical}
			class:flex-col={!vertical}
			class:justify-center={!vertical}
			class:flex-row={vertical}
			class:justify-between={vertical}
		>
			{#if primaryDisplay.id !== 'none'}
				<div
					class="flex font-bold"
					class:text-xl={textSize === 'large'}
					class:text-lg={textSize === 'medium'}
					class:text-md={textSize === 'small'}
				>
					{#if primaryDisplay.type === 'sum'}
						<DisplayCurrency amount={currentData.primary} positiveGreen />
					{:else}
						{currentData.primary}
					{/if}
				</div>
			{/if}
			{#if secondaryDisplay.id !== 'none'}
				<div
					class="flex font-bold"
					class:text-xl={textSize === 'large' && vertical}
					class:text-lg={(textSize === 'medium' && vertical) || (textSize === 'large' && !vertical)}
					class:text-md={(textSize === 'small' && vertical) || (textSize === 'medium' && !vertical)}
					class:text-sm={textSize === 'small' && !vertical}
				>
					{#if secondaryDisplay.type === 'sum'}
						<DisplayCurrency amount={currentData.secondary} positiveGreen />
					{:else}
						{currentData.secondary}
					{/if}
				</div>
			{/if}
		</div>
		{#if currentData.timeSeries && sparklineOptions.id !== 'none'}
			<ReportElementSparkline
				data={currentData.timeSeries}
				type={sparklineOptions.graphType}
				class="flex"
				format={sparklineOptions.type === "count" ? "Count" : "USD"} 
			/>
		{/if}
	</div>
{/await}
