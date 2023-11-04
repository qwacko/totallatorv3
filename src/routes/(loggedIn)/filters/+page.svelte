<script lang="ts">
	import { Button, ButtonGroup, Input } from 'flowbite-svelte';
	import PageLayout from '$lib/components/PageLayout.svelte';
	import { page } from '$app/stores';
	import { pageInfo, pageInfoStore, urlGenerator } from '$lib/routes.js';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import CustomHeader from '$lib/components/CustomHeader.svelte';
	import CustomTable from '$lib/components/table/CustomTable.svelte';
	import { reusableFilterColumnsStore } from '$lib/stores/columnDisplayStores.js';
	import { defaultJournalFilter } from '$lib/schema/journalSchema';
	import JournalEntryIcon from '$lib/components/icons/JournalEntryIcon.svelte';
	import EditIcon from '$lib/components/icons/EditIcon.svelte';
	import DeleteIcon from '$lib/components/icons/DeleteIcon.svelte';
	import RawDataModal from '$lib/components/RawDataModal.svelte';

	export let data;
	$: urlInfo = pageInfo('/(loggedIn)/filters', $page);

	const urlStore = pageInfoStore({
		routeId: '/(loggedIn)/filters',
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
	pageNumber={data.filters.page}
	numPages={data.filters.pageCount}
/>

<PageLayout title="Reusable Filters" size="xl">
	<svelte:fragment slot="right">
		<Button
			href={urlGenerator({ address: '/(loggedIn)/filters/create', searchParamsValue: {} }).url}
			color="light"
			outline
		>
			Create
		</Button>
	</svelte:fragment>

	{#if $urlStore.searchParams && data.searchParams}
		<CustomTable
			highlightText={$urlStore.searchParams?.title}
			highlightTextColumns={['title']}
			filterText={data.filterText}
			onSortURL={(newSort) => urlInfo.updateParams({ searchParams: { orderBy: newSort } }).url}
			paginationInfo={{
				page: data.filters.page,
				count: data.filters.count,
				perPage: data.filters.pageSize,
				buttonCount: 5,
				urlForPage: (value) => urlInfo.updateParams({ searchParams: { page: value } }).url
			}}
			noneFoundText="No Matching Filters Found"
			data={data.filters.data}
			currentOrder={data.searchParams?.orderBy}
			currentFilter={data.searchParams}
			filterModalTitle="Filter Reusable Filters"
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
					id: 'filterText',
					title: 'Filter',
					rowToDisplay: (row) => row.filterText,
					sortKey: 'filterText'
				},
				{
					id: 'changeText',
					title: 'Change',
					rowToDisplay: (row) => row.changeText || '',
					sortKey: 'changeText'
				}
			]}
			bind:shownColumns={$reusableFilterColumnsStore}
		>
			<svelte:fragment slot="customBodyCell" let:currentColumn let:row>
				{#if currentColumn.id === 'actions'}
					<ButtonGroup>
						<Button
							href={urlGenerator({
								address: '/(loggedIn)/journals',
								searchParamsValue: { ...defaultJournalFilter(), ...row.filter }
							}).url}
							class="p-2"
							color="blue"
							outline
							size="sm"
						>
							<JournalEntryIcon />
						</Button>
						<Button
							href={urlGenerator({
								address: '/(loggedIn)/filters/[id]',
								paramsValue: { id: row.id }
							}).url}
							class="p-2"
							outline
						>
							<EditIcon />
						</Button>
						<Button
							href={urlGenerator({
								address: '/(loggedIn)/filters/[id]/delete',
								paramsValue: { id: row.id }
							}).url}
							class="p-2"
							outline
							color="red"
						>
							<DeleteIcon />
						</Button>
						<RawDataModal data={row} title="Reusable Filter Data" dev={data.dev} />
					</ButtonGroup>
				{/if}
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
		</CustomTable>
	{/if}
</PageLayout>
