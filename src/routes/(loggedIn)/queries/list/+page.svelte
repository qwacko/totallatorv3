<script lang="ts">
	import { Button, ButtonGroup, Dropdown, DropdownItem, Input } from 'flowbite-svelte';
	import PageLayout from '$lib/components/PageLayout.svelte';
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
	import FilterIcon from '$lib/components/icons/FilterIcon.svelte';
	import { sizeToText } from '$lib/helpers/sizeToText';

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
					sortKey: 'title'
				},
				{
					id: 'parameters',
					title: 'Parameters'
				},
				{
					id: 'duration',
					title: 'Duration',
					sortKey: 'duration'
				},
				{
					id: 'time',
					title: 'Time',
					sortKey: 'time'
				},
				{
					id: 'size',
					title: 'Size',
					sortKey: 'size',
					rowToDisplay: (row) => sizeToText(row.size)
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
					<div class="flex flex-row justify-center">
						<ButtonGroup>
							<QueryDetailModal data={currentRow} />
							<RawDataModal data={currentRow} title="Raw Grouped Query Data" dev={data.dev} />
						</ButtonGroup>
					</div>
				{:else if currentColumn.id === 'title'}
					<div class="flex flex-row items-center gap-2">
						{currentRow.title}
						{#if currentRow.titleId}
							<Button
								size="xs"
								outline
								class="border-0"
								href={urlInfo.updateParams({
									searchParams: {
										titleIdArray: [currentRow.titleId]
									}
								}).url}
							>
								<FilterIcon />
							</Button>
						{/if}
					</div>
				{:else if currentColumn.id === 'time'}
					{@const timeString = currentRow.time ? `${currentRow.time.toLocaleString()}.${String(currentRow.time.getMilliseconds()).padStart(3,"0")}` : ''}
					{@const minuteOffsets = [1, 2, 5, 10, 60, 120]}
					<div class="flex flex-row items-center gap-2">
						{timeString}
						<Button size="xs" outline class="border-0"><FilterIcon /></Button>
						<Dropdown>
							<DropdownItem
								href={urlInfo.updateParams({
									searchParams: {
										start: currentRow.time.toISOString(),
										end: currentRow.time.toISOString()
									}
								}).url}
							>
								{timeString}
							</DropdownItem>
							{#each minuteOffsets as currentOffset}
								{@const start = new Date(currentRow.time.getTime() - currentOffset * 60 * 1000)}
								{@const end = new Date(currentRow.time.getTime() + currentOffset * 60 * 1000)}
								<DropdownItem
									href={urlInfo.updateParams({
										searchParams: { start: start.toISOString(), end: end.toISOString() }
									}).url}
								>
									±{currentOffset} min
								</DropdownItem>
							{/each}
						</Dropdown>
					</div>
				{:else if currentColumn.id === 'duration'}
					{@const duration = currentRow.duration || 0}
					{@const durationSpans = [1, 2, 5, 10, 50, 100]}
					<div class="flex flex-row items-center gap-2">
						{duration.toFixed() || ''}ms
						<Button size="xs" outline class="border-0"><FilterIcon /></Button>
						<Dropdown>
							<DropdownItem
								href={urlInfo.updateParams({
									searchParams: { minDuration: duration, maxDuration: duration }
								}).url}
							>
								{duration.toFixed()}ms
							</DropdownItem>
							{#each durationSpans as span}
								{@const max = duration + span}
								{@const min = Math.max(duration - span, 0)}
								<DropdownItem
									href={urlInfo.updateParams({
										searchParams: { minDuration: min, maxDuration: max }
									}).url}
								>
									{min.toFixed()}ms to {max.toFixed()}ms
								</DropdownItem>
							{/each}
						</Dropdown>
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
					<Button
						href={urlGenerator({
							address: '/(loggedIn)/queries/list',
							searchParamsValue: { page: 0, pageSize: 10 }
						}).url}
						outline
					>
						Clear Filter
					</Button>
				</div>
			</svelte:fragment>
		</CustomTable>{/if}
</PageLayout>
