<script lang="ts">
	import { Button, ButtonGroup, Input } from 'flowbite-svelte';
	import PageLayout from '$lib/components/PageLayout.svelte';
	import { page } from '$app/stores';
	import { pageInfo, pageInfoStore, urlGenerator } from '$lib/routes';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import RawDataModal from '$lib/components/RawDataModal.svelte';
	import CustomHeader from '$lib/components/CustomHeader.svelte';
	import CustomTable from '$lib/components/table/CustomTable.svelte';
	import { groupedQueryColumnsStore } from '$lib/stores/columnDisplayStores';
	import GroupedChartQueryPopover from './GroupedChartQueryPopover.svelte';
	import DbQueryIcon from '$lib/components/icons/DBQueryIcon.svelte';
	import { sizeToText } from '$lib/helpers/sizeToText';

	export let data;
	$: urlInfo = pageInfo('/(loggedIn)/queries/grouped', $page);

	const urlStore = pageInfoStore({
		routeId: '/(loggedIn)/queries/grouped',
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
	pageTitle="Grouped Queries"
	filterText={data.filterText}
	pageNumber={data.data.page}
	numPages={data.data.pageCount}
/>

<PageLayout title="Grouped Queries Log" size="xl">
	<svelte:fragment slot="right">
		<Button color="light" outline href={urlGenerator({ address: '/(loggedIn)/labels/create' }).url}>
			Create
		</Button>
	</svelte:fragment>
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
			noneFoundText="No Matching Grouped Queries Found"
			data={data.data.data}
			currentOrder={data.searchParams?.orderBy}
			currentFilter={data.searchParams}
			filterModalTitle="Filter Grouped Queries"
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
					id: 'maxDuration',
					title: 'Max Duration',
					rowToDisplay: (row) => `${(row.maxDuration || 0).toFixed()}ms`,
					sortKey: 'maxDuration'
				},
				{
					id: 'minDuration',
					title: 'Min Duration',
					rowToDisplay: (row) => `${(row.minDuration || 0).toFixed()}ms`,
					sortKey: 'minDuration'
				},
				{
					id: 'averageDuration',
					title: 'Avg Duration',
					rowToDisplay: (row) => `${(Number(row.averageDuration) || 0).toFixed(1)}ms`,
					sortKey: 'averageDuration'
				},
				{
					id: 'maxSize',
					title: 'Max Size',
					rowToDisplay: (row) => sizeToText(row.maxSize),
					sortKey: 'maxSize'
				},
				{
					id: 'minSize',
					title: 'Min Size',
					rowToDisplay: (row) => sizeToText(row.minSize),
					sortKey: 'minSize'
				},
				{
					id: 'averageSize',
					title: 'Avg Size',
					rowToDisplay: (row) => sizeToText(row.averageSize),
					sortKey: 'averageSize'
				},
				{
					id: 'totalSize',
					title: 'Total Size',
					rowToDisplay: (row) => sizeToText(row.totalSize),
					sortKey: 'totalSize'
				},
				{
					id: 'totalTime',
					title: 'Total Duration',
					rowToDisplay: (row) => (Number(row.totalTime) || 0).toFixed(1) || '',
					sortKey: 'totalTime'
				},
				{
					id: 'count',
					title: 'Count',
					rowToDisplay: (row) => (row.count || 0).toFixed(),
					sortKey: 'count'
				},
				{
					id: 'first',
					title: 'First',
					rowToDisplay: (row) =>
						row.first
							? `${row.first.toLocaleString()}.${String(row.first.getMilliseconds()).padStart(3, '0')}`
							: '',
					sortKey: 'first'
				},
				{
					id: 'last',
					title: 'Last',
					rowToDisplay: (row) =>
						row.last
							? `${row.last.toLocaleString()}.${String(row.last.getMilliseconds()).padStart(3, '0')}`
							: '',
					sortKey: 'last'
				}
			]}
			bind:shownColumns={$groupedQueryColumnsStore}
		>
			<svelte:fragment slot="customBodyCell" let:row={currentRow} let:currentColumn>
				{#if currentColumn.id === 'actions'}
					{@const detailURL = urlGenerator({
						address: '/(loggedIn)/queries/list',
						searchParamsValue: {
							titleIdArray: currentRow.titleId ? [currentRow.titleId] : [],
							pageSize: 10,
							page: 0
						}
					}).url}
					<div class="flex flex-row justify-center">
						<ButtonGroup>
							<Button href={detailURL} class="p-2">
								<DbQueryIcon height={15} width={15} />
							</Button>
							<GroupedChartQueryPopover data={currentRow} />
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
