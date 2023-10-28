<script lang="ts">
	import { Button, ButtonGroup, Input } from 'flowbite-svelte';
	import PageLayout from '$lib/components/PageLayout.svelte';
	import { statusToDisplay } from '$lib/schema/statusSchema';
	import EditIcon from '$lib/components/icons/EditIcon.svelte';
	import DeleteIcon from '$lib/components/icons/DeleteIcon.svelte';
	import { page } from '$app/stores';
	import { pageInfo, pageInfoStore, urlGenerator } from '$lib/routes.js';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import RawDataModal from '$lib/components/RawDataModal.svelte';
	import { defaultJournalFilter } from '$lib/schema/journalSchema.js';
	import JournalEntryIcon from '$lib/components/icons/JournalEntryIcon.svelte';
	import JournalSummaryPopoverContent from '$lib/components/JournalSummaryPopoverContent.svelte';
	import CustomHeader from '$lib/components/CustomHeader.svelte';
	import DownloadDropdown from '$lib/components/DownloadDropdown.svelte';
	import CustomTable from '$lib/components/table/CustomTable.svelte';
	import { budgetColumnsStore } from '$lib/stores/columnDisplayStores.js';
	import BudgetFilter from '$lib/components/filters/BudgetFilter.svelte';

	export let data;
	$: urlInfo = pageInfo('/(loggedIn)/budgets', $page);

	const urlStore = pageInfoStore({
		routeId: '/(loggedIn)/budgets',
		pageInfo: page,
		onUpdate: (newURL) => {
			if (browser && newURL !== urlInfo.current.url) {
				goto(newURL, { keepFocus: true, noScroll: true });
			}
		},
		updateDelay: 500
	});
</script>

<CustomHeader
	pageTitle="Journals"
	filterText={data.filterText}
	pageNumber={data.budgets.page}
	numPages={data.budgets.pageCount}
/>

<PageLayout title="Budgets" size="lg">
	<svelte:fragment slot="right">
		<Button
			href={urlGenerator({ address: '/(loggedIn)/budgets/create' }).url}
			color="light"
			outline
		>
			Create
		</Button>
	</svelte:fragment>
	<JournalSummaryPopoverContent
		item={data.budgetSummary}
		format={data.user?.currencyFormat || 'USD'}
		summaryFilter={{ budget: $urlStore.searchParams } || defaultJournalFilter}
		showJournalLink
	/>
	<CustomTable
		highlightText={$urlStore.searchParams?.title}
		highlightTextColumns={['title', 'group', 'single']}
		filterText={data.filterText}
		onSortURL={(newSort) => urlInfo.updateParams({ searchParams: { orderBy: newSort } }).url}
		paginationInfo={{
			page: data.budgets.page,
			count: data.budgets.count,
			perPage: data.budgets.pageSize,
			buttonCount: 5,
			urlForPage: (value) => urlInfo.updateParams({ searchParams: { page: value } }).url
		}}
		noneFoundText="No Matching Budgets Found"
		data={data.budgets.data}
		currentOrder={data.searchParams?.orderBy}
		currentFilter={data.searchParams}
		filterModalTitle="Filter Budgets"
		columns={[
			{ id: 'actions', title: '' },

			{
				id: 'title',
				title: 'Title',
				rowToDisplay: (row) => row.title,
				sortKey: 'title'
			},
			{
				id: 'status',
				title: 'Status',
				rowToDisplay: (row) => statusToDisplay(row.status),
				sortKey: 'status'
			},
			{
				id: 'total',
				title: 'Total',
				rowToCurrency: (row) => ({ amount: row.sum, format: data.user?.currencyFormat || 'USD' })
			},
			{ id: 'count', title: 'Count', rowToDisplay: (row) => row.count.toString() }
		]}
		bind:shownColumns={$budgetColumnsStore}
		rowColour={(row) => (row.disabled ? 'grey' : undefined)}
	>
		<svelte:fragment slot="customBodyCell" let:row={currentRow} let:currentColumn>
			{#if currentColumn.id === 'actions'}
				{@const detailURL = urlGenerator({
					address: '/(loggedIn)/budgets/[id]',
					paramsValue: { id: currentRow.id }
				}).url}

				{@const deleteURL = urlGenerator({
					address: '/(loggedIn)/budgets/[id]/delete',
					paramsValue: { id: currentRow.id }
				}).url}
				{@const journalsURL = urlGenerator({
					address: '/(loggedIn)/journals',
					searchParamsValue: {
						...defaultJournalFilter(),
						budget: { id: currentRow.id }
					}
				}).url}
				<div class="flex flex-row justify-center">
					<ButtonGroup>
						<Button href={journalsURL} class="p-2" outline color="blue">
							<JournalEntryIcon height={15} width={15} />
						</Button>
						<Button href={detailURL} class="p-2" outline>
							<EditIcon height={15} width={15} />
						</Button>
						<Button href={deleteURL} class="p-2" outline color="red">
							<DeleteIcon height={15} width={15} />
						</Button>
						<RawDataModal data={currentRow} title="Raw Budget Data" dev={data.dev} />
					</ButtonGroup>
				</div>
			{/if}
		</svelte:fragment>
		<svelte:fragment slot="filterButtons">
			<DownloadDropdown
				urlGenerator={(downloadType) =>
					urlGenerator({
						address: '/(loggedIn)/budgets/download',
						searchParamsValue: { ...$urlStore.searchParams, downloadType }
					}).url}
			/>
		</svelte:fragment>
		<svelte:fragment slot="filter">
			<div class="flex flex-row gap-2">
				{#if $urlStore.searchParams}
					<Input
						type="text"
						bind:value={$urlStore.searchParams.title}
						placeholder="Filter by Title"
						class="flex flex-grow"
					/>
				{/if}
			</div>
		</svelte:fragment>
		<svelte:fragment slot="filterModal">
			<BudgetFilter bind:filter={$urlStore.searchParams} budgetDetails={data.budgetDropdowns} />
		</svelte:fragment>
	</CustomTable>
</PageLayout>
