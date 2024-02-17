<script lang="ts">
	import { getCurrencyFormatter, } from '$lib/schema/userSchema';

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
	import TimeAndTransferButtons from './journalSummary/TimeAndTransferButtons.svelte';
	import { currencyFormat } from '$lib/stores/userInfoStore';

	export let item: SummaryCacheSchemaDataType;
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
				...defaultJournalFilter(),
				...combinedFilter
			}
		}).url;

		await goto(newURL);
	};

	$: href = urlGenerator({
		address: '/(loggedIn)/journals',
		searchParamsValue: {
			...defaultJournalFilter(),
			...summaryFilter
		}
	}).url;

	$: latestYearMonth = generateYearMonthsBeforeToday(12);
	$: last12Months = filterTrendData({ data: item.monthlySummary, dates: latestYearMonth });

	$: formatter = getCurrencyFormatter($currencyFormat);

	$: yearChange = last12Months.reduce((prev, current) => prev + current.sum, 0);
</script>

{#if $showSummaryStore}
	<div class="flex flex-col gap-2">
		<div class="flex flex-row gap-2">
			<Button
				color="light"
				size="xs"
				on:click={() => ($showSummaryStore = false)}
				class="h-8 flex-row gap-2"
			>
				<EyeIcon /> Hide Summary
			</Button>
			{#if showJournalLink}
				<Button {href} color="light" size="xs" class="h-8 flex-row gap-2">
					<JournalEntryIcon />
				</Button>
			{/if}
			<div class="flex flex-grow flex-col items-end gap-0.5">
				<div class="flex text-lg">
					<DisplayCurrency amount={item.sum} />
				</div>

				<div class="flex text-xs">
					<DisplayCurrency amount={yearChange} positiveGreen={true} />
				</div>
			</div>
		</div>
		<Tabs contentClass="" style="underline">
			{#each popoverViewEnum as currentItem}
				<TabItem
					open={$popoverViewStore.type === currentItem}
					title={currentItem}
					on:click={() => ($popoverViewStore.type = currentItem)}
				/>
			{/each}
		</Tabs>
		<div class="min-h-[280px]">
			<TimeAndTransferButtons bind:config={$popoverViewStore} />
			{#if $popoverViewStore.type === 'Line'}
				{@const chartConfig = generateTotalTrendConfig({
					data: item.monthlySummary,
					formatter,
					height: chartHeight,
					onYearMonthClick: (yearMonth) => gotoUpdatedFilter({ yearMonth: [yearMonth] }),
					config: $popoverViewStore
				})}
				<Chart {...chartConfig} />
			{/if}

			{#if $popoverViewStore.type === 'Flow'}
				{@const recentFlowChartConfig = generateFlowTrendConfig({
					data: item.monthlySummary,
					formatter,
					height: chartHeight,
					onYearMonthClick: (yearMonth) => gotoUpdatedFilter({ yearMonth: [yearMonth] }),
					config: $popoverViewStore
				})}
				<Chart {...recentFlowChartConfig} />
			{/if}

			{#if $popoverViewStore.type === 'Account'}
				{@const accountsChartConfig = generatePIChartConfig({
					data: item.accounts,
					formatter,
					height: chartHeight,
					title: 'Account',
					onClick: async (id) =>
						id
							? gotoUpdatedFilter({
									account: { id, type: ['asset', 'liability', 'income', 'expense'] }
								})
							: null,
					config: $popoverViewStore
				})}
				<Chart {...accountsChartConfig} />
			{/if}

			{#if $popoverViewStore.type === 'Tag'}
				{@const tagsChartConfig = generatePIChartConfig({
					data: item.tags,
					formatter,
					height: chartHeight,
					title: 'Tag',
					onClick: async (id) => (id ? gotoUpdatedFilter({ tag: { id } }) : null),
					config: $popoverViewStore
				})}
				<Chart {...tagsChartConfig} />
			{/if}

			{#if $popoverViewStore.type === 'Category'}
				{@const categoriesChartConfig = generatePIChartConfig({
					data: item.categories,
					formatter,
					height: chartHeight,
					title: 'Category',
					onClick: async (id) => (id ? gotoUpdatedFilter({ category: { id } }) : null),
					config: $popoverViewStore
				})}
				<Chart {...categoriesChartConfig} />
			{/if}

			{#if $popoverViewStore.type === 'Bill'}
				{@const billsChartConfig = generatePIChartConfig({
					data: item.bills,
					formatter,
					height: chartHeight,
					title: 'Bills',
					onClick: async (id) => (id ? gotoUpdatedFilter({ bill: { id } }) : null),
					config: $popoverViewStore
				})}
				<Chart {...billsChartConfig} />
			{/if}

			{#if $popoverViewStore.type === 'Budget'}
				{@const budgetsChartConfig = generatePIChartConfig({
					data: item.budgets,
					formatter,
					height: chartHeight,
					title: 'Budget',
					onClick: async (id) => (id ? gotoUpdatedFilter({ budget: { id } }) : null),
					config: $popoverViewStore
				})}
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
			class="h-8 flex-row gap-2"
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
