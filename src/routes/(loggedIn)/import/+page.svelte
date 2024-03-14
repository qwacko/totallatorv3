<script lang="ts">
	import CustomHeader from '$lib/components/CustomHeader.svelte';
	import PageLayout from '$lib/components/PageLayout.svelte';
	import {
		importStatusToColour,
		importStatusToTest,
		importTypeToTitle
	} from '$lib/schema/importSchema.js';
	import { Badge, Button, Card, Input, ButtonGroup } from 'flowbite-svelte';
	import { page } from '$app/stores';
	import { pageInfo, pageInfoStore, urlGenerator } from '$lib/routes.js';
	import { goto, invalidateAll, onNavigate } from '$app/navigation';
	import { browser } from '$app/environment';
	import CustomTable from '$lib/components/table/CustomTable.svelte';
	import { tagColumnsStore } from '$lib/stores/columnDisplayStores';
	import RawDataModal from '$lib/components/RawDataModal.svelte';
	import EditIcon from '$lib/components/icons/EditIcon.svelte';

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

	$: if(browser && data.needsRefresh){
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
			highlightText={$urlStore.searchParams?.title}
			highlightTextColumns={['title', 'group', 'single']}
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
				}
			]}
			bind:shownColumns={$tagColumnsStore}
			rowColour={() => undefined}
		>
			<svelte:fragment slot="customBodyCell" let:row={currentRow} let:currentColumn>
				{#if currentColumn.id === 'actions'}
					{@const detailURL = urlGenerator({
						address: '/(loggedIn)/import/[id]',
						paramsValue: { id: currentRow.id }
					}).url}

					<!-- {@const deleteURL = urlGenerator({
						address: '/(loggedIn)/tags/[id]/delete',
						paramsValue: { id: currentRow.id }
					}).url}
					{@const journalsURL = urlGenerator({
						address: '/(loggedIn)/journals',
						searchParamsValue: {
							...defaultJournalFilter(),
							tag: { id: currentRow.id }
						}
					}).url} -->
					<div class="flex flex-row justify-center">
						<ButtonGroup>
							<Button href={detailURL} class="p-2" outline>
								<EditIcon height={15} width={15} />
							</Button>

							<!-- <Button
									href={deleteURL}
									class="p-2"
									outline
									color="red"
									disabled={(currentRow.count || 0) > 0}
								>
									<DeleteIcon height={15} width={15} />
								</Button> -->
							<RawDataModal data={currentRow} title="Raw Import Data" dev={data.dev} />
						</ButtonGroup>
					</div>
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
			<!-- <svelte:fragment slot="filterModal">
				<TagFilter bind:filter={$urlStore.searchParams} tagDetails={data.tagDropdowns} />
			</svelte:fragment> -->
		</CustomTable>{/if}

	<div class="grid grid-cols-1 gap-2">
		{#each data.imports.data as currentImport}
			<Card
				href={urlGenerator({
					address: '/(loggedIn)/import/[id]',
					paramsValue: { id: currentImport.id }
				}).url}
				size="xl"
				padding="md"
				class="flex flex-col gap-2"
			>
				<div class="flex font-bold">{currentImport.title}</div>
				<div class="flex flex-row gap-4">
					<div class="flex flex-row gap-2">
						<div class="flex font-semibold">Date</div>
						<div class="flex">{currentImport.createdAt.toISOString().slice(0, 10)}</div>
					</div>
					{#if currentImport.type !== 'transaction'}
						<div class="flex flex-row gap-2">
							<div class="flex font-semibold">Duplicate Checking</div>
							<div class="flex">
								{#if currentImport.checkImportedOnly}Imported Only{:else}All{/if}
							</div>
						</div>
					{/if}
				</div>
				<div class="flex flex-row gap-4">
					<div class="flex flex-row gap-2">
						<div class="flex font-semibold">Type</div>
						<div class="flex">{importTypeToTitle(currentImport.type)}</div>
					</div>
					{#if currentImport.type === 'mappedImport'}
						<div class="flex flex-row gap-2">
							<div class="flex font-semibold">Import Mapping</div>
							<div class="flex">{currentImport.importMappingTitle}</div>
						</div>
					{/if}
				</div>
				<Badge color={importStatusToColour(currentImport.status)}>
					{importStatusToTest(currentImport.status)}
				</Badge>

				<div class="flex flex-row flex-wrap items-center gap-2 self-center">
					<Badge color={importStatusToColour('processed')}>
						{currentImport.numProcessed} Processed
					</Badge>
					<Badge color={importStatusToColour('error')}>
						{currentImport.numErrors} Processing Error
					</Badge>
					<Badge color={importStatusToColour('error')}>
						{currentImport.numImportErrors} Import Error
					</Badge>
					<Badge color={importStatusToColour('duplicate')}>
						{currentImport.numDuplicate} Duplicate
					</Badge>
					<Badge color={importStatusToColour('imported')}>
						{currentImport.numImport} Imported
					</Badge>
				</div>
			</Card>
		{/each}
	</div>
</PageLayout>
