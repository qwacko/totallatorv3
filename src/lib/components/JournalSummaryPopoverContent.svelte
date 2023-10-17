<script lang="ts">
	import { getCurrencyFormatter, type currencyFormatType } from '$lib/schema/userSchema';

	import { Chart, Tabs, TabItem, Button } from 'flowbite-svelte';
	import {
		generateFlowTrendConfig,
		generatePIChartConfig,
		generateTotalTrendConfig
	} from './helpers/generateTrendConfig';
	import { generateYearMonthsBeforeToday } from '$lib/helpers/generateYearMonthsBetween';
	import { filterTrendData } from './helpers/FilterTrendData';
	import DisplayCurrency from './DisplayCurrency.svelte';
	import type { SummaryCacheSchemaDataType } from '$lib/schema/summaryCacheSchema';
	import {
		type JournalFilterSchemaInputType,
		defaultJournalFilter
	} from '$lib/schema/journalSchema';
	import { merge } from 'lodash-es';
	import { goto } from '$app/navigation';
	import { urlGenerator } from '$lib/routes';
	import type { DeepPartialWithoutArray } from '$lib/helpers/DeepPartialType';
	import { popoverViewEnum, popoverViewStore, showSummaryStore } from '$lib/stores/popoverView';
	import EyeIcon from './icons/EyeIcon.svelte';
	import JournalEntryIcon from './icons/JournalEntryIcon.svelte';

	export let item: SummaryCacheSchemaDataType;
	export let format: currencyFormatType = 'USD';
	export let summaryFilter: DeepPartialWithoutArray<
		Omit<JournalFilterSchemaInputType, 'orderBy' | 'page' | 'pageSize'>
	> = {};
	export let showJournalLink = false;

	const chartHeight = '250';

	const gotoUpdatedFilter = async (
		updatedFilter: DeepPartialWithoutArray<
			Omit<JournalFilterSchemaInputType, 'orderBy' | 'page' | 'pageSize'>
		>
	) => {
		const combinedFilter = merge(summaryFilter, updatedFilter);

		const newURL = urlGenerator({
			address: '/(loggedIn)/journals',
			searchParamsValue: {
				...defaultJournalFilter,
				...combinedFilter
			}
		}).url;

		console.log('New URL : ', newURL);

		await goto(newURL);
	};

	$: href = urlGenerator({
		address: '/(loggedIn)/journals',
		searchParamsValue: {
			...defaultJournalFilter,
			...summaryFilter
		}
	}).url;

	$: latestYearMonth = generateYearMonthsBeforeToday(12);
	$: last12Months = filterTrendData({ data: item.monthlySummary, dates: latestYearMonth });

	$: formatter = getCurrencyFormatter(format);
	$: chartConfig = generateTotalTrendConfig({
		data: item.monthlySummary,
		formatter,
		height: chartHeight,
		onYearMonthClick: (yearMonth) => gotoUpdatedFilter({ yearMonth: [yearMonth] })
	});
	$: recentChartConfig = generateTotalTrendConfig({
		data: last12Months,
		formatter,
		height: chartHeight,
		onYearMonthClick: (yearMonth) => gotoUpdatedFilter({ yearMonth: [yearMonth] })
	});
	$: recentFlowChartConfig = generateFlowTrendConfig({
		data: last12Months,
		formatter,
		height: chartHeight,
		onYearMonthClick: (yearMonth) => gotoUpdatedFilter({ yearMonth: [yearMonth] })
	});
	$: accountsChartConfig = generatePIChartConfig({
		data: item.accounts,
		formatter,
		height: chartHeight,
		title: 'Account',
		onClick: async (id) =>
			id
				? gotoUpdatedFilter({ account: { id, type: ['asset', 'liability', 'income', 'expense'] } })
				: null
	});
	$: tagsChartConfig = generatePIChartConfig({
		data: item.tags,
		formatter,
		height: chartHeight,
		title: 'Tag',
		onClick: async (id) => (id ? gotoUpdatedFilter({ tag: { id } }) : null)
	});
	$: billsChartConfig = generatePIChartConfig({
		data: item.bills,
		formatter,
		height: chartHeight,
		title: 'Bills',
		onClick: async (id) => (id ? gotoUpdatedFilter({ bill: { id } }) : null)
	});
	$: budgetsChartConfig = generatePIChartConfig({
		data: item.budgets,
		formatter,
		height: chartHeight,
		title: 'Budget',
		onClick: async (id) => (id ? gotoUpdatedFilter({ budget: { id } }) : null)
	});
	$: categoriesChartConfig = generatePIChartConfig({
		data: item.categories,
		formatter,
		height: chartHeight,
		title: 'Category',
		onClick: async (id) => (id ? gotoUpdatedFilter({ category: { id } }) : null)
	});
	$: yearChange = last12Months.reduce((prev, current) => prev + current.sum, 0);
</script>

{#if $showSummaryStore}
	<div class="flex flex-col gap-2">
		<div class="flex flex-row gap-2">
			<Button
				color="light"
				size="xs"
				on:click={() => ($showSummaryStore = false)}
				class="flex-row gap-2 h-8"
			>
				<EyeIcon /> Hide Summary
			</Button>
			{#if showJournalLink}
				<Button {href} color="light" size="xs" class="flex-row gap-2 h-8">
					<JournalEntryIcon />
				</Button>
			{/if}
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
			{#each popoverViewEnum as currentItem}
				<TabItem
					open={$popoverViewStore === currentItem}
					title={currentItem}
					on:click={() => ($popoverViewStore = currentItem)}
				/>
			{/each}
		</Tabs>
		<div class="min-h-[280px]">
			{#if $popoverViewStore === 'Recent'}
				<Chart {...recentChartConfig} />
			{/if}

			{#if $popoverViewStore === 'All'}
				<Chart {...chartConfig} />
			{/if}

			{#if $popoverViewStore === 'Flow'}
				<Chart {...recentFlowChartConfig} />
			{/if}

			{#if $popoverViewStore === 'Account'}
				<Chart {...accountsChartConfig} />
			{/if}

			{#if $popoverViewStore === 'Tag'}
				<Chart {...tagsChartConfig} />
			{/if}

			{#if $popoverViewStore === 'Category'}
				<Chart {...categoriesChartConfig} />
			{/if}

			{#if $popoverViewStore === 'Bill'}
				<Chart {...billsChartConfig} />
			{/if}

			{#if $popoverViewStore === 'Budget'}
				<Chart {...budgetsChartConfig} />
			{/if}
		</div>
	</div>
{:else}
	<div class="flex flex-row gap-2">
		<Button
			on:click={() => ($showSummaryStore = true)}
			color="light"
			size="xs"
			class="flex-row gap-2 h-8"
		>
			<EyeIcon /> Show Summary
		</Button>
		{#if showJournalLink}
			<Button {href} color="light" size="xs" class="h-8">
				<JournalEntryIcon />
			</Button>
		{/if}
		<div class="flex flex-grow" />
	</div>
{/if}
