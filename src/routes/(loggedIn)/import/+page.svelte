<script lang="ts">
	import CustomHeader from '$lib/components/CustomHeader.svelte';
	import PageLayout from '$lib/components/PageLayout.svelte';
	import {
		importStatusToColour,
		importStatusToTest,
		importTypeToTitle
	} from '$lib/schema/importSchema.js';
	import { Badge, Button, Input, ButtonGroup, Spinner } from 'flowbite-svelte';
	import { page } from '$app/stores';
	import { pageInfo, pageInfoStore, urlGenerator } from '$lib/routes.js';
	import { goto, invalidateAll, onNavigate } from '$app/navigation';
	import { browser } from '$app/environment';
	import CustomTable from '$lib/components/table/CustomTable.svelte';
	import { importColumnsStore } from '$lib/stores/columnDisplayStores';
	import RawDataModal from '$lib/components/RawDataModal.svelte';
	import EditIcon from '$lib/components/icons/EditIcon.svelte';
	import { defaultJournalFilter } from '$lib/schema/journalSchema';
	import JournalEntryIcon from '$lib/components/icons/JournalEntryIcon.svelte';

	export let data;
	$: urlInfo = pageInfo('/(loggedIn)/import', $page);

	const urlStore = pageInfoStore({
		routeId: '/(loggedIn)/import',
		pageInfo: page,
		onUpdate: (newURL) => {
			if (browser && newURL !== urlInfo.current.url) {
				goto(newURL, { keepFocus: true, noScroll: true });
			}
		},
		updateDelay: 500
	});

	let filterOpened = false;

	onNavigate(() => {
		filterOpened = false;
	});

	$: if (browser && data.needsRefresh) {
		setTimeout(() => {
			invalidateAll();
		}, 2000);
	}
</script>

<CustomHeader pageTitle="Imports" />

<PageLayout title="Imports" size="xl">
	<svelte:fragment slot="right">
		<Button color="light" href={urlGenerator({ address: '/(loggedIn)/import/create' }).url} outline>
			Add
		</Button>
	</svelte:fragment>

	{#if $urlStore.searchParams && data.searchParams}
		<CustomTable
			highlightText={$urlStore.searchParams?.textFilter}
			highlightTextColumns={['title', 'mapping']}
			filterText={data.filterText}
			onSortURL={(newSort) => urlInfo.updateParams({ searchParams: { orderBy: newSort } }).url}
			paginationInfo={{
				page: data.imports.page,
				count: data.imports.count,
				perPage: data.imports.pageSize,
				buttonCount: 5,
				urlForPage: (value) => urlInfo.updateParams({ searchParams: { page: value } }).url
			}}
			noneFoundText="No Matching Imports Found"
			data={data.imports.data}
			currentOrder={data.searchParams?.orderBy}
			currentFilter={data.searchParams}
			filterModalTitle="Filter Imports"
			bind:numberRows={$urlStore.searchParams.pageSize}
			bind:filterOpened
			columns={[
				{ id: 'actions', title: '' },
				{
					id: 'title',
					title: 'Title',
					rowToDisplay: (row) => row.title,
					sortKey: 'title'
				},

				{
					id: 'type',
					title: 'Type',
					rowToDisplay: (row) => importTypeToTitle(row.type),
					sortKey: 'type'
				},
				{
					id: 'mapping',
					title: 'Mapping',
					rowToDisplay: (row) => row.importMappingTitle
				},
				{
					id: 'status',
					title: 'Status',
					sortKey: 'status'
				},
				{
					id: 'numErrors',
					title: 'Errors',
					rowToDisplay: (row) => (row.numErrors > 0 ? row.numErrors.toString() : ''),
					sortKey: 'numErrors'
				},
				{
					id: 'numImportErrors',
					title: 'Import Errors',
					rowToDisplay: (row) => (row.numImportErrors > 0 ? row.numImportErrors.toString() : ''),
					sortKey: 'numImportErrors'
				},
				{
					id: 'numDuplicate',
					title: 'Duplicate',
					rowToDisplay: (row) => (row.numDuplicate > 0 ? row.numDuplicate.toString() : ''),
					sortKey: 'numDuplicate'
				},
				{
					id: 'numImport',
					title: 'Imported',
					rowToDisplay: (row) => (row.numImport > 0 ? row.numImport.toString() : ''),
					sortKey: 'numImport'
				},
				{
					id: 'numProcessed',
					title: 'Processed',
					rowToDisplay: (row) => (row.numProcessed ? row.numProcessed.toString() : ''),
					sortKey: 'numProcessed'
				},
				{
					id: 'createdAt',
					title: 'Date',
					rowToDisplay: (row) => row.createdAt.toISOString().slice(0, 10),
					sortKey: 'createdAt'
				}
			]}
			bind:shownColumns={$importColumnsStore}
			rowColour={() => undefined}
		>
			<svelte:fragment slot="customBodyCell" let:row={currentRow} let:currentColumn>
				{#if currentColumn.id === 'actions'}
					{@const detailURL = urlGenerator({
						address: '/(loggedIn)/import/[id]',
						paramsValue: { id: currentRow.id }
					}).url}
					{@const journalsURL = urlGenerator({
						address: '/(loggedIn)/journals',
						searchParamsValue: {
							...defaultJournalFilter(),
							importIdArray: [currentRow.id]
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
							<RawDataModal data={currentRow} title="Raw Import Data" dev={data.dev} />
						</ButtonGroup>
					</div>
				{:else if currentColumn.id === 'status'}
					<Badge color={importStatusToColour(currentRow.status)}>
						<div class="m-2 flex flex-row items-center gap-2">
							{#if currentRow.status === 'importing' || currentRow.status === 'awaitingImport'}<Spinner
									size="4"
									color="green"
								/>
							{/if}
							{importStatusToTest(currentRow.status)}
						</div>
					</Badge>
				{/if}
			</svelte:fragment>
			<svelte:fragment slot="filter">
				<div class="flex flex-row gap-2">
					{#if $urlStore.searchParams}
						<Input
							type="text"
							bind:value={$urlStore.searchParams.textFilter}
							placeholder="Filter by Title / Mapping"
							class="flex flex-grow"
						/>
					{/if}
				</div>
			</svelte:fragment>
		</CustomTable>{/if}
</PageLayout>
