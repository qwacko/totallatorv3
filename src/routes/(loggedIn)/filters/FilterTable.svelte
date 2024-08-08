<script lang="ts">
	import { Button, ButtonGroup, DropdownItem, Input } from 'flowbite-svelte';
	import { urlGenerator } from '$lib/routes.js';
	import { onNavigate } from '$app/navigation';
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
	import type { reusableFilterActions } from '$lib/server/db/actions/reusableFilterActions.js';
	import type { ReusableFilterFilterSchemaType } from '$lib/schema/reusableFilterSchema';
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';

	let {
		dataForTable,
		filterText,
		searchParams = $bindable(),
		dev,
		urlForPage,
		urlForSort,
		loading
	}: {
		dataForTable: Awaited<ReturnType<(typeof reusableFilterActions)['list']>>;
		filterText: string[];
		searchParams: ReusableFilterFilterSchemaType | undefined;
		dev: boolean;
		urlForPage: (value: number) => string;
		urlForSort: (value: ReusableFilterFilterSchemaType['orderBy']) => string;
		loading: boolean;
	} = $props();

	let filterOpened = $state(false);

	onNavigate(() => {
		filterOpened = false;
	});
</script>

<CustomHeader
	pageTitle="Reusable Filters"
	{filterText}
	pageNumber={dataForTable.page}
	numPages={dataForTable.pageCount}
/>

{#if searchParams}
	<CustomTable
		highlightText={searchParams.multipleText}
		highlightTextColumns={['title', 'group', 'filterText', 'changeText']}
		{filterText}
		onSortURL={urlForSort}
		paginationInfo={{
			page: dataForTable.page,
			count: dataForTable.count,
			perPage: dataForTable.pageSize,
			buttonCount: 5,
			urlForPage
		}}
		noneFoundText="No Matching Filters Found"
		data={dataForTable.data}
		currentOrder={searchParams?.orderBy}
		currentFilter={searchParams}
		filterModalTitle="Filter Reusable Filters"
		bind:numberRows={searchParams.pageSize}
		bind:shownColumns={$reusableFilterColumnsStore}
		bind:filterOpened
		columns={[
			{ id: 'actions', title: 'Actions' },
			{
				id: 'applyAutomatically',
				title: 'Automatic',
				rowToDisplay: (row) => (row.applyAutomatically ? 'Y' : ''),
				sortKey: 'applyAutomatically',
				filterActive: Boolean(searchParams.applyAutomatically !== undefined),
				showTitleOnMobile: true
			},
			{
				id: 'applyFollowingImport',
				title: 'Import',
				rowToDisplay: (row) => (row.applyFollowingImport ? 'Y' : ''),
				sortKey: 'applyFollowingImport',
				filterActive: Boolean(searchParams.applyFollowingImport !== undefined),
				showTitleOnMobile: true
			},
			{
				id: 'listed',
				title: 'Dropdown',
				sortKey: 'listed',
				rowToDisplay: (row) => (row.listed ? 'Y' : ''),
				filterActive: Boolean(searchParams.listed !== undefined),
				showTitleOnMobile: true
			},
			{
				id: 'modificationType',
				title: 'Modifiation',
				sortKey: 'modificationType',
				filterActive: Boolean(searchParams.modificationType !== undefined),
				showTitleOnMobile: true
			},
			{
				id: 'group',
				title: 'Group',
				rowToDisplay: (row) => row.group || '',
				sortKey: 'group',
				filterActive: Boolean(searchParams.group !== undefined && searchParams.group !== ''),
				showTitleOnMobile: true
			},
			{
				id: 'title',
				title: 'Title',
				rowToDisplay: (row) => row.title,
				sortKey: 'title',
				filterActive: Boolean(searchParams.title !== undefined && searchParams.title !== '')
			},
			{
				id: 'filterText',
				title: 'Filter',
				rowToDisplay: (row) => row.filterText,
				sortKey: 'filterText',
				filterActive: Boolean(searchParams.filterText !== undefined),
				showTitleOnMobile: true
			},
			{
				id: 'changeText',
				title: 'Change',
				rowToDisplay: (row) => row.changeText || '',
				sortKey: 'changeText',
				filterActive: Boolean(searchParams.filterText !== undefined),
				showTitleOnMobile: true
			},
			{
				id: 'journalCount',
				title: 'Journal Count',
				sortKey: 'journalCount',
				rowToDisplay: (row) => row.journalCount.toString(),
				showTitleOnMobile: true
			},
			{
				id: 'canApply',
				title: 'Can Apply',
				sortKey: 'canApply',
				rowToDisplay: (row) => (row.canApply ? 'Y' : ''),
				showTitleOnMobile: true
			}
		]}
	>
		{#snippet slotCustomBodyCell({ currentColumn, row })}
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
					<RawDataModal data={row} title="Reusable Filter Data" {dev} />
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
		{/snippet}
		{#snippet slotFilter()}
			<div class="flex flex-row gap-2">
				{#if searchParams}
					<Input
						type="text"
						bind:value={searchParams.multipleText}
						placeholder="Filter by Group / Title / Filter / Change"
						class="flex flex-grow"
					/>
				{/if}
			</div>
		{/snippet}

		{#snippet slotHeaderItem({ currentColumn })}
			{#if searchParams}
				{#if currentColumn.id === 'group'}
					<DropdownItem>
						<Input type="text" bind:value={searchParams.group} placeholder="Group Filter" />
					</DropdownItem>
				{:else if currentColumn.id === 'title'}
					<DropdownItem>
						<Input type="text" bind:value={searchParams.title} placeholder="Title Filter" />
					</DropdownItem>
				{:else if currentColumn.id === 'filterText'}
					<DropdownItem>
						<Input type="text" bind:value={searchParams.filterText} placeholder="Filter Filter" />
					</DropdownItem>
				{:else if currentColumn.id === 'changeText'}
					<DropdownItem>
						<Input type="text" bind:value={searchParams.changeText} placeholder="Change Filter" />
					</DropdownItem>
				{:else if currentColumn.id === 'applyAutomatically'}
					<DropdownItem>
						<BooleanFilterButtons
							bind:value={searchParams.applyAutomatically}
							onTitle="Y"
							offTitle="N"
						/>
					</DropdownItem>
				{:else if currentColumn.id === 'applyFollowingImport'}
					<DropdownItem>
						<BooleanFilterButtons
							bind:value={searchParams.applyFollowingImport}
							onTitle="Y"
							offTitle="N"
						/>
					</DropdownItem>
				{:else if currentColumn.id === 'listed'}
					<DropdownItem>
						<BooleanFilterButtons bind:value={searchParams.listed} onTitle="Y" offTitle="N" />
					</DropdownItem>
				{/if}
			{/if}
		{/snippet}
		{#snippet slotFilterModal()}
			{#if searchParams}
				<ReusableFilterFilter bind:filter={searchParams} />
			{/if}
		{/snippet}
		{#snippet slotBulkActions()}
			{#if loading}
				<LoadingSpinner loadingText="Updating Count..." />
			{/if}
		{/snippet}
	</CustomTable>
{/if}
