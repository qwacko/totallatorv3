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
	import JournalEntryIcon from '$lib/components/icons/JournalEntryIcon.svelte';
	import { defaultJournalFilter } from '$lib/schema/journalSchema.js';
	import JournalSummaryPopoverContent from '$lib/components/JournalSummaryPopoverContent.svelte';
	import CustomHeader from '$lib/components/CustomHeader.svelte';
	import DownloadDropdown from '$lib/components/DownloadDropdown.svelte';
	import CustomTable from '$lib/components/table/CustomTable.svelte';
	import { billColumnsStore } from '$lib/stores/columnDisplayStores.js';
	import BillFilter from '$lib/components/filters/BillFilter.svelte';

	export let data;
	$: urlInfo = pageInfo('/(loggedIn)/bills', $page);

	const urlStore = pageInfoStore({
		routeId: '/(loggedIn)/bills',
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
	pageTitle="Bills"
	filterText={data.filterText}
	pageNumber={data.bills.page}
	numPages={data.bills.pageCount}
/>

<PageLayout title="Bills" size="xl">
	<svelte:fragment slot="right">
		<Button href={urlGenerator({ address: '/(loggedIn)/bills/create' }).url} color="light" outline>
			Create
		</Button>
	</svelte:fragment>
	<JournalSummaryPopoverContent
		item={data.billSummary}
		format={data.user?.currencyFormat || 'USD'}
		summaryFilter={{ bill: $urlStore.searchParams } || defaultJournalFilter()}
		showJournalLink
	/>
	<CustomTable
		highlightText={$urlStore.searchParams?.title}
		highlightTextColumns={['title']}
		filterText={data.filterText}
		onSortURL={(newSort) => urlInfo.updateParams({ searchParams: { orderBy: newSort } }).url}
		paginationInfo={{
			page: data.bills.page,
			count: data.bills.count,
			perPage: data.bills.pageSize,
			buttonCount: 5,
			urlForPage: (value) => urlInfo.updateParams({ searchParams: { page: value } }).url
		}}
		noneFoundText="No Matching Tags Found"
		data={data.bills.data}
		currentOrder={data.searchParams?.orderBy}
		currentFilter={data.searchParams}
		filterModalTitle="Filter Tags"
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
			{ id: 'count', title: 'Count', rowToDisplay: (row) => row.count.toString() },
			{
				id: 'firstDate',
				title: 'First',
				rowToDisplay: (row) => (row.firstDate ? row.firstDate.toISOString().slice(0, 10) : '')
			},
			{
				id: 'lastDate',
				title: 'Last',
				rowToDisplay: (row) => (row.lastDate ? row.lastDate.toISOString().slice(0, 10) : '')
			}
		]}
		bind:shownColumns={$billColumnsStore}
		rowColour={(row) => (row.disabled ? 'grey' : undefined)}
	>
		<svelte:fragment slot="customBodyCell" let:row={currentRow} let:currentColumn>
			{#if currentColumn.id === 'actions'}
				{@const detailURL = urlGenerator({
					address: '/(loggedIn)/bills/[id]',
					paramsValue: { id: currentRow.id }
				}).url}

				{@const deleteURL = urlGenerator({
					address: '/(loggedIn)/bills/[id]/delete',
					paramsValue: { id: currentRow.id }
				}).url}
				{@const journalsURL = urlGenerator({
					address: '/(loggedIn)/journals',
					searchParamsValue: {
						...defaultJournalFilter(),
						bill: { id: currentRow.id }
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
						<RawDataModal data={currentRow} title="Raw Bill Data" dev={data.dev} />
					</ButtonGroup>
				</div>
			{/if}
		</svelte:fragment>
		<svelte:fragment slot="filterButtons">
			<DownloadDropdown
				urlGenerator={(downloadType) =>
					urlGenerator({
						address: '/(loggedIn)/bills/download',
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
			<BillFilter bind:filter={$urlStore.searchParams} billDetails={data.billDropdowns} />
		</svelte:fragment>
	</CustomTable>
</PageLayout>
