<script lang="ts">
	import { Button, ButtonGroup, DropdownItem, Input } from 'flowbite-svelte';
	import PageLayout from '$lib/components/PageLayout.svelte';
	import { page } from '$app/stores';
	import { pageInfo, pageInfoStore, urlGenerator } from '$lib/routes.js';
	import { goto, onNavigate } from '$app/navigation';
	import { browser } from '$app/environment';
	import CustomHeader from '$lib/components/CustomHeader.svelte';
	import CustomTable from '$lib/components/table/CustomTable.svelte';
	import { reusableFilterColumnsStore } from '$lib/stores/columnDisplayStores.js';
	import { defaultJournalFilter } from '$lib/schema/journalSchema';
	import JournalEntryIcon from '$lib/components/icons/JournalEntryIcon.svelte';
	import EditIcon from '$lib/components/icons/EditIcon.svelte';
	import DeleteIcon from '$lib/components/icons/DeleteIcon.svelte';
	import RawDataModal from '$lib/components/RawDataModal.svelte';
	import BooleanFilterButtons from '$lib/components/filters/BooleanFilterButtons.svelte';
	import ReusableFilterFilter from '$lib/components/filters/ReusableFilterFilter.svelte';
	import CloneIcon from '$lib/components/icons/CloneIcon.svelte';
	import FilterModifyIcon from '$lib/components/icons/FilterModifyIcon.svelte';
	import FilterReplaceIcon from '$lib/components/icons/FilterReplaceIcon.svelte';
	import ApplyFilterIcon from '$lib/components/icons/ApplyFilterIcon.svelte';

	export let data;

	$: dataForTable = data.filters;
	$: urlInfo = pageInfo('/(loggedIn)/filters', $page);

	const updateData = async () => {
		const newData = await data.streamed.filters;
		dataForTable = newData;
	};

	$: data.filters && updateData();

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

	let filterOpened = false;

	onNavigate(() => {
		filterOpened = false;
	});
</script>

<CustomHeader
	pageTitle="Reusable Filters"
	filterText={data.filterText}
	pageNumber={dataForTable.page}
	numPages={dataForTable.pageCount}
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
			highlightText={$urlStore.searchParams?.multipleText}
			highlightTextColumns={['title', 'group', 'filterText', 'changeText']}
			filterText={data.filterText}
			onSortURL={(newSort) => urlInfo.updateParams({ searchParams: { orderBy: newSort } }).url}
			paginationInfo={{
				page: dataForTable.page,
				count: dataForTable.count,
				perPage: dataForTable.pageSize,
				buttonCount: 5,
				urlForPage: (value) => urlInfo.updateParams({ searchParams: { page: value } }).url
			}}
			noneFoundText="No Matching Filters Found"
			data={dataForTable.data}
			currentOrder={data.searchParams?.orderBy}
			currentFilter={data.searchParams}
			filterModalTitle="Filter Reusable Filters"
			bind:numberRows={$urlStore.searchParams.pageSize}
			bind:shownColumns={$reusableFilterColumnsStore}
			bind:filterOpened
			columns={[
				{ id: 'actions', title: 'Actions' },
				{
					id: 'applyAutomatically',
					title: 'Automatic',
					rowToDisplay: (row) => (row.applyAutomatically ? 'Y' : ''),
					sortKey: 'applyAutomatically',
					filterActive: Boolean(data.searchParams.applyAutomatically !== undefined)
				},
				{
					id: 'applyFollowingImport',
					title: 'Import',
					rowToDisplay: (row) => (row.applyFollowingImport ? 'Y' : ''),
					sortKey: 'applyFollowingImport',
					filterActive: Boolean(data.searchParams.applyFollowingImport !== undefined)
				},
				{
					id: 'listed',
					title: 'Dropdown',
					sortKey: 'listed',
					rowToDisplay: (row) => (row.listed ? 'Y' : ''),
					filterActive: Boolean(data.searchParams.listed !== undefined)
				},
				{
					id: 'modificationType',
					title: 'Modifiation',
					sortKey: 'modificationType',
					filterActive: Boolean(data.searchParams.modificationType !== undefined)
				},
				{
					id: 'group',
					title: 'Group',
					rowToDisplay: (row) => row.group || '',
					sortKey: 'group',
					filterActive: Boolean(
						data.searchParams.group !== undefined && data.searchParams.group !== ''
					)
				},
				{
					id: 'title',
					title: 'Title',
					rowToDisplay: (row) => row.title,
					sortKey: 'title',
					filterActive: Boolean(
						data.searchParams.title !== undefined && data.searchParams.title !== ''
					)
				},
				{
					id: 'filterText',
					title: 'Filter',
					rowToDisplay: (row) => row.filterText,
					sortKey: 'filterText',
					filterActive: Boolean(data.searchParams.filterText !== undefined)
				},
				{
					id: 'changeText',
					title: 'Change',
					rowToDisplay: (row) => row.changeText || '',
					sortKey: 'changeText',
					filterActive: Boolean(data.searchParams.filterText !== undefined)
				},
				{
					id: 'journalCount',
					title: 'Journal Count',
					sortKey: 'journalCount',
					rowToDisplay: (row) => row.journalCount.toString()
				},
				{
					id: 'canApply',
					title: 'Can Apply',
					sortKey: 'canApply',
					rowToDisplay: (row) => (row.canApply ? 'Y' : '')
				}
			]}
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
								paramsValue: { id: row.id },
								searchParamsValue: {}
							}).url}
							class="p-2"
							outline
						>
							<EditIcon />
						</Button>
						<Button
							class="p-2"
							href={urlGenerator({
								address: '/(loggedIn)/filters/create',
								searchParamsValue: { ...row, modificationType: row.modificationType || undefined }
							}).url}
							outline
						>
							<CloneIcon />
						</Button>
						<Button
							class="p-2"
							href={urlGenerator({
								address: '/(loggedIn)/filters/[id]/apply',
								paramsValue: { id: row.id }
							}).url}
							color="blue"
							outline
							disabled={!row.canApply}
						>
							<ApplyFilterIcon />
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
				{:else if currentColumn.id === 'modificationType'}
					{#if row.listed}
						<div class="flex flex-row gap-4">
							{#if row.modificationType === 'modify'}
								<FilterModifyIcon />
							{:else if row.modificationType === 'replace'}
								<FilterReplaceIcon />
							{/if}
							<div class="flex">
								{row.modificationType === 'modify'
									? 'Modify'
									: row.modificationType === 'replace'
									? 'Replace'
									: "'"}
							</div>
						</div>
					{/if}
				{/if}
			</svelte:fragment>
			<svelte:fragment slot="filter">
				<div class="flex flex-row gap-2">
					{#if $urlStore.searchParams}
						<Input
							type="text"
							bind:value={$urlStore.searchParams.multipleText}
							placeholder="Filter by Group / Title / Filter / Change"
							class="flex flex-grow"
						/>
					{/if}
				</div>
			</svelte:fragment>

			<svelte:fragment slot="headerItem" let:currentColumn>
				{#if currentColumn.id === 'group'}
					<DropdownItem>
						<Input
							type="text"
							bind:value={$urlStore.searchParams.group}
							placeholder="Group Filter"
						/>
					</DropdownItem>
				{:else if currentColumn.id === 'title'}
					<DropdownItem>
						<Input
							type="text"
							bind:value={$urlStore.searchParams.title}
							placeholder="Title Filter"
						/>
					</DropdownItem>
				{:else if currentColumn.id === 'filterText'}
					<DropdownItem>
						<Input
							type="text"
							bind:value={$urlStore.searchParams.filterText}
							placeholder="Filter Filter"
						/>
					</DropdownItem>
				{:else if currentColumn.id === 'changeText'}
					<DropdownItem>
						<Input
							type="text"
							bind:value={$urlStore.searchParams.changeText}
							placeholder="Change Filter"
						/>
					</DropdownItem>
				{:else if currentColumn.id === 'applyAutomatically'}
					<DropdownItem>
						<BooleanFilterButtons
							bind:value={$urlStore.searchParams.applyAutomatically}
							onTitle="Y"
							offTitle="N"
						/>
					</DropdownItem>
				{:else if currentColumn.id === 'applyFollowingImport'}
					<DropdownItem>
						<BooleanFilterButtons
							bind:value={$urlStore.searchParams.applyFollowingImport}
							onTitle="Y"
							offTitle="N"
						/>
					</DropdownItem>
				{:else if currentColumn.id === 'listed'}
					<DropdownItem>
						<BooleanFilterButtons
							bind:value={$urlStore.searchParams.listed}
							onTitle="Y"
							offTitle="N"
						/>
					</DropdownItem>
				{/if}
			</svelte:fragment>
			<svelte:fragment slot="filterModal">
				<ReusableFilterFilter bind:filter={$urlStore.searchParams} />
			</svelte:fragment>
		</CustomTable>
	{/if}
</PageLayout>
