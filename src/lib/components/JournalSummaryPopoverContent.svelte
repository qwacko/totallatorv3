<script lang="ts">
	import type { JournalSummaryType } from '$lib/server/db/actions/journalActions';
	import { getCurrencyFormatter, type currencyFormatType } from '$lib/schema/userSchema';

	import { Button, Chart, Tabs, TabItem } from 'flowbite-svelte';
	import { generateFlowTrendConfig, generateTotalTrendConfig } from './helpers/generateTrendConfig';
	import { generateYearMonthsBeforeToday } from '$lib/helpers/generateYearMonthsBetween';
	import { filterTrendData } from './helpers/FilterTrendData';
	import DisplayCurrency from './DisplayCurrency.svelte';
	import JournalEntryIcon from './icons/JournalEntryIcon.svelte';

	export let href: string;
	export let item: JournalSummaryType & { id: string };
	export let format: currencyFormatType = 'USD';
	export let onYearMonthClick: (yearMonth: string) => void = () => {};

	let selection: 'Recent' | 'All' | 'Flow' = 'Recent';
	const chartHeight = '250';

	$: latestYearMonth = generateYearMonthsBeforeToday(12);
	$: last12Months = filterTrendData({ data: item.monthlySummary, dates: latestYearMonth });

	$: formatter = getCurrencyFormatter(format);
	$: chartConfig = generateTotalTrendConfig({
		data: item.monthlySummary,
		formatter,
		height: chartHeight,
		onYearMonthClick
	});
	$: recentChartConfig = generateTotalTrendConfig({
		data: last12Months,
		formatter,
		height: chartHeight,
		onYearMonthClick
	});
	$: recentFlowChartConfig = generateFlowTrendConfig({
		data: last12Months,
		formatter,
		height: chartHeight,
		onYearMonthClick
	});
	$: yearChange = last12Months.reduce((prev, current) => prev + current.sum, 0);
	$: yearCount = last12Months.reduce((prev, current) => prev + current.count, 0);
</script>

<div class="flex flex-col gap-2 w-60">
	<div class="flex flex-row">
		<div class="flex">
			<Button {href} color="none" size="xs"><JournalEntryIcon /></Button>
		</div>
		<div class="flex flex-col gap-0.5 items-end flex-grow">
			<div class="flex text-lg">
				<DisplayCurrency amount={item.sum} {format} />
			</div>

			<div class="flex text-xs">
				<DisplayCurrency amount={yearChange} {format} positiveGreen={true} />
			</div>
		</div>
	</div>
	<Tabs contentClass="" style="underline">
		<TabItem open title="Recent" on:click={() => (selection = 'Recent')} />
		<TabItem title="All" on:click={() => (selection = 'All')} />
		<TabItem title="Flow" on:click={() => (selection = 'Flow')} />
	</Tabs>
	{#if selection === 'Recent'}
		<Chart {...recentChartConfig} />
	{/if}

	{#if selection === 'All'}
		<Chart {...chartConfig} />
	{/if}

	{#if selection === 'Flow'}
		<Chart {...recentFlowChartConfig} />
	{/if}
</div>
