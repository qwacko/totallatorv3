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
	import { importProgressToText } from './importProgressToText.js';

	const { data } = $props();
	const urlInfo = $derived(pageInfo('/(loggedIn)/import', $page));

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

	let filterOpened = $state(false);

	onNavigate(() => {
		filterOpened = false;
	});

	$effect(() => {
		if (browser && data.needsRefresh) {
			setTimeout(() => {
				invalidateAll();
			}, 2000);
		}
	});
</script>

<CustomHeader pageTitle="Imports" />

<PageLayout title="Imports" size="xl">
	{#snippet slotRight()}
		<Button color="light" href={urlGenerator({ address: '/(loggedIn)/import/create' }).url} outline>
			Add
		</Button>
	{/snippet}

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
					id: 'autoProcess',
					title: 'Auto Process',
					sortKey: 'autoProcess',
					showTitleOnMobile: true
				},
				{
					id: 'autoClean',
					title: 'Auto Clean',
					sortKey: 'autoClean',
					showTitleOnMobile: true
				},
				{
					id: 'type',
					title: 'Type',
					rowToDisplay: (row) => importTypeToTitle(row.type),
					sortKey: 'type',
					showTitleOnMobile: true
				},
				{
					id: 'mapping',
					title: 'Mapping',
					rowToDisplay: (row) => row.importMappingTitle,
					sortKey: 'importMappingTitle',
					showTitleOnMobile: true
				},
				{
					id: 'status',
					title: 'Status',
					sortKey: 'status',
					showTitleOnMobile: true
				},
				{
					id: 'numErrors',
					title: 'Errors',
					rowToDisplay: (row) => (row.numErrors > 0 ? row.numErrors.toString() : ''),
					sortKey: 'numErrors',
					showTitleOnMobile: true
				},
				{
					id: 'numImportErrors',
					title: 'Import Errors',
					rowToDisplay: (row) => (row.numImportErrors > 0 ? row.numImportErrors.toString() : ''),
					sortKey: 'numImportErrors',
					showTitleOnMobile: true
				},
				{
					id: 'numDuplicate',
					title: 'Duplicate',
					rowToDisplay: (row) => (row.numDuplicate > 0 ? row.numDuplicate.toString() : ''),
					sortKey: 'numDuplicate',
					showTitleOnMobile: true
				},
				{
					id: 'numImport',
					title: 'Imported',
					rowToDisplay: (row) => (row.numImport > 0 ? row.numImport.toString() : ''),
					sortKey: 'numImport',
					showTitleOnMobile: true
				},
				{
					id: 'numProcessed',
					title: 'Processed',
					rowToDisplay: (row) => (row.numProcessed ? row.numProcessed.toString() : ''),
					sortKey: 'numProcessed',
					showTitleOnMobile: true
				},
				{
					id: 'createdAt',
					title: 'Date',
					rowToDisplay: (row) => row.createdAt.toISOString().slice(0, 10),
					sortKey: 'createdAt',
					showTitleOnMobile: true
				}
			]}
			bind:shownColumns={$importColumnsStore}
			rowColour={() => undefined}
		>
			{#snippet slotCustomBodyCell({ row: currentRow, currentColumn })}
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
							{importStatusToTest(currentRow.status)}{importProgressToText(currentRow.importStatus)}
						</div>
					</Badge>
				{:else if currentColumn.id === 'autoProcess'}
					{#if currentRow.autoProcess === true}
						<Badge color="green">Auto</Badge>
					{:else}
						<Badge color="yellow">Manual</Badge>
					{/if}
				{:else if currentColumn.id === 'autoClean'}
					{#if currentRow.autoClean === true}
						<Badge color="green">Auto</Badge>
					{:else}
						<Badge color="yellow">Manual</Badge>
					{/if}
				{/if}
			{/snippet}
			{#snippet slotFilter()}
				<div class="flex flex-row gap-2">
					{#if $urlStore.searchParams}
						<Input
							type="text"
							bind:value={$urlStore.searchParams.textFilter}
							placeholder="Filter by Title / Mapping"
							class="flex grow"
						/>
					{/if}
				</div>
			{/snippet}
		</CustomTable>{/if}
</PageLayout>
