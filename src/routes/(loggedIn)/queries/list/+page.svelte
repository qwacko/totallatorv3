<script lang="ts">
	import { Button, ButtonGroup, Input } from 'flowbite-svelte';
	import PageLayout from '$lib/components/PageLayout.svelte';
	import EditIcon from '$lib/components/icons/EditIcon.svelte';
	import { page } from '$app/stores';
	import { pageInfo, pageInfoStore, urlGenerator } from '$lib/routes';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import RawDataModal from '$lib/components/RawDataModal.svelte';
	import CustomHeader from '$lib/components/CustomHeader.svelte';
	import CustomTable from '$lib/components/table/CustomTable.svelte';
	import { queryColumnsStore } from '$lib/stores/columnDisplayStores';
	import QueryDetailModal from './QueryDetailModal.svelte';
	import QueryXyChart from './QueryXYChart.svelte';

	export let data;
	$: urlInfo = pageInfo('/(loggedIn)/queries/list', $page);

	const urlStore = pageInfoStore({
		routeId: '/(loggedIn)/queries/list',
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
	pageTitle="Queries"
	filterText={data.filterText}
	pageNumber={data.data.page}
	numPages={data.data.pageCount}
/>

<PageLayout title="Queries Log" size="xl">
	{#await data.xyData then xyData}
		<QueryXyChart data={xyData} />
	{/await}
	{#if $urlStore.searchParams && data.searchParams}
		<CustomTable
			filterText={data.filterText}
			onSortURL={(newSort) => urlInfo.updateParams({ searchParams: { orderBy: newSort } }).url}
			paginationInfo={{
				page: data.data.page,
				count: data.data.count,
				perPage: data.data.pageSize,
				buttonCount: 5,
				urlForPage: (value) => urlInfo.updateParams({ searchParams: { page: value } }).url
			}}
			noneFoundText="No Matching Queries Found"
			data={data.data.data}
			currentOrder={data.searchParams?.orderBy}
			currentFilter={data.searchParams}
			filterModalTitle="Filter Queries"
			bind:numberRows={$urlStore.searchParams.pageSize}
			columns={[
				{ id: 'actions', title: '' },
				{
					id: 'title',
					title: 'Title',
					rowToDisplay: (row) => row.title,
					sortKey: 'title'
				},
				{
					id: 'parameters',
					title: 'Parameters'
				},
				{
					id: 'duration',
					title: 'Duration',
					rowToDisplay: (row) => (row.duration || 0).toFixed() || '',
					sortKey: 'duration'
				},
				{
					id: 'time',
					title: 'Time',
					rowToDisplay: (row) => (row.time ? row.time.toLocaleString() : ''),
					sortKey: 'time'
				},
				{
					id: 'params',
					title: 'Params',
					rowToDisplay: (row) => row.params
				}
			]}
			bind:shownColumns={$queryColumnsStore}
		>
			<svelte:fragment slot="customBodyCell" let:row={currentRow} let:currentColumn>
				{#if currentColumn.id === 'actions'}
					{@const detailURL = urlGenerator({
						address: '/(loggedIn)/queries/list',
						searchParamsValue: { titleArray: currentRow.title ? [currentRow.title] : undefined }
					}).url}
					<div class="flex flex-row justify-center">
						<ButtonGroup>
							<Button href={detailURL} class="p-2" outline>
								<EditIcon height={15} width={15} />
							</Button>
							<QueryDetailModal data={currentRow} />
							<RawDataModal data={currentRow} title="Raw Grouped Query Data" dev={data.dev} />
						</ButtonGroup>
					</div>
				{/if}
			</svelte:fragment>
			<svelte:fragment slot="filter">
				<div class="flex flex-row gap-2">
					{#if $urlStore.searchParams}
						<Input
							type="text"
							bind:value={$urlStore.searchParams.textFilter}
							placeholder="Filter..."
							class="flex flex-grow"
						/>
					{/if}
				</div>
			</svelte:fragment>
		</CustomTable>{/if}
</PageLayout>
