<script lang="ts">
	import type { JournalSummaryType } from '$lib/server/db/actions/journalActions';
	import { getCurrencyFormatter, type currencyFormatType } from '$lib/schema/userSchema';

	import { Button, Chart, Tabs, TabItem } from 'flowbite-svelte';
	import {
		generateFlowTrendConfig,
		generatePIChartConfig,
		generateTotalTrendConfig
	} from './helpers/generateTrendConfig';
	import { generateYearMonthsBeforeToday } from '$lib/helpers/generateYearMonthsBetween';
	import { filterTrendData } from './helpers/FilterTrendData';
	import DisplayCurrency from './DisplayCurrency.svelte';
	import JournalEntryIcon from './icons/JournalEntryIcon.svelte';
	import type { SummaryCacheSchemaDataType } from '$lib/schema/summaryCacheSchema';

	export let href: string;
	export let item: SummaryCacheSchemaDataType;
	export let format: currencyFormatType = 'USD';
	export let onYearMonthClick: (yearMonth: string) => void = () => {};

	let selection: 'Recent' | 'All' | 'Flow' | 'Tag' | 'Account' | 'Category' | 'Bill' | 'Budget' =
		'Recent';
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
	$: accountsChartConfig = generatePIChartConfig({
		data: item.accounts,
		formatter,
		height: chartHeight,
		title: 'Account'
	});
	$: tagsChartConfig = generatePIChartConfig({
		data: item.tags,
		formatter,
		height: chartHeight,
		title: 'Tag'
	});
	$: billsChartConfig = generatePIChartConfig({
		data: item.bills,
		formatter,
		height: chartHeight,
		title: 'Bills'
	});
	$: budgetsChartConfig = generatePIChartConfig({
		data: item.budgets,
		formatter,
		height: chartHeight,
		title: 'Budget'
	});
	$: categoriesChartConfig = generatePIChartConfig({
		data: item.categories,
		formatter,
		height: chartHeight,
		title: 'Category'
	});
	$: yearChange = last12Months.reduce((prev, current) => prev + current.sum, 0);
	$: yearCount = last12Months.reduce((prev, current) => prev + current.count, 0);
</script>

<div class="flex flex-col gap-2">
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
		<TabItem title="Account" on:click={() => (selection = 'Account')} />
		<TabItem title="Tag" on:click={() => (selection = 'Tag')} />
		<TabItem title="Category" on:click={() => (selection = 'Category')} />
		<TabItem title="Bill" on:click={() => (selection = 'Bill')} />
		<TabItem title="Budget" on:click={() => (selection = 'Budget')} />
	</Tabs>
	<div class="min-h-[280px]">
		{#if selection === 'Recent'}
			<Chart {...recentChartConfig} />
		{/if}

		{#if selection === 'All'}
			<Chart {...chartConfig} />
		{/if}

		{#if selection === 'Flow'}
			<Chart {...recentFlowChartConfig} />
		{/if}

		{#if selection === 'Account'}
			<Chart {...accountsChartConfig} />
		{/if}

		{#if selection === 'Tag'}
			<Chart {...tagsChartConfig} />
		{/if}

		{#if selection === 'Category'}
			<Chart {...categoriesChartConfig} />
		{/if}

		{#if selection === 'Bill'}
			<Chart {...billsChartConfig} />
		{/if}

		{#if selection === 'Budget'}
			<Chart {...budgetsChartConfig} />
		{/if}
	</div>
</div>
