<script lang="ts">
	import DisplayCurrency from '$lib/components/DisplayCurrency.svelte';
	import { displayTimeOptionsData } from '$lib/schema/reportHelpers/displayTimeOptionsEnum';
	import type { ReportElementNumberData } from '$lib/server/db/actions/helpers/report/getData';
	import { Spinner } from 'flowbite-svelte';
	import ReportElementSparkline from './ReportElementSparkline.svelte';

	export let data: ReportElementNumberData;

	$: primaryDisplay = displayTimeOptionsData[data.numberDisplay];
	$: secondaryDisplay = displayTimeOptionsData[data.numberSecondaryDisplay];
</script>

{#await data.data}
	<Spinner />
{:then currentData}
	<div class="flex flex-row gap-2">
		<div class="flex flex-col items-end justify-center gap-2">
			{#if primaryDisplay.id !== 'none'}
				<div class="flex text-xl font-bold">
					{#if primaryDisplay.type === 'sum'}
						<DisplayCurrency amount={currentData.primary} positiveGreen />
					{:else}
						{currentData.primary}
					{/if}
				</div>
			{/if}
			{#if secondaryDisplay.id !== 'none'}
				<div class="flex text-lg font-bold">
					{#if secondaryDisplay.type === 'sum'}
						<DisplayCurrency amount={currentData.secondary} positiveGreen />
					{:else}
						{currentData.secondary}
					{/if}
				</div>
			{/if}
		</div>
		{#if currentData.timeSeries}
			<div class="flex h-full">
				<ReportElementSparkline data={currentData.timeSeries} />
			</div>
		{/if}
	</div>
{/await}
