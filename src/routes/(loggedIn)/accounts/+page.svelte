<script lang="ts">
	import { Button, ButtonGroup, Input } from 'flowbite-svelte';
	import PageLayout from '$lib/components/PageLayout.svelte';
	import { statusToDisplay } from '$lib/schema/statusSchema';
	import EditIcon from '$lib/components/icons/EditIcon.svelte';
	import DeleteIcon from '$lib/components/icons/DeleteIcon.svelte';
	import { page } from '$app/stores';
	import { pageInfo, pageInfoStore, urlGenerator } from '$lib/routes.js';
	import { goto, onNavigate } from '$app/navigation';
	import { browser } from '$app/environment';

	import AccountTypeFilterLinks from '$lib/components/AccountTypeFilterLinks.svelte';
	import RawDataModal from '$lib/components/RawDataModal.svelte';
	import { defaultJournalFilter } from '$lib/schema/journalSchema';
	import { accountTypeEnum, accountTypeToDisplay } from '$lib/schema/accountTypeSchema';
	import JournalEntryIcon from '$lib/components/icons/JournalEntryIcon.svelte';
	import JournalSummaryPopoverContent from '$lib/components/JournalSummaryPopoverContent.svelte';
	import CustomHeader from '$lib/components/CustomHeader.svelte';
	import DownloadDropdown from '$lib/components/DownloadDropdown.svelte';
	import CustomTable from '$lib/components/table/CustomTable.svelte';
	import AccountFilter from '$lib/components/filters/AccountFilter.svelte';
	import { accountColumnsStore } from '$lib/stores/columnDisplayStores.js';
	import { enhance } from '$app/forms';
	import DisabledIcon from '$lib/components/icons/DisabledIcon.svelte';
	import { summaryColumns } from '$lib/schema/summarySchema.js';
	import { currencyFormat } from '$lib/stores/userInfoStore.js';

	export let data;
	$: urlInfo = pageInfo('/(loggedIn)/accounts', $page);

	const urlStore = pageInfoStore({
		routeId: '/(loggedIn)/accounts',
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
	pageTitle="Accounts"
	filterText={data.filterText}
	pageNumber={data.accounts.page}
	numPages={data.accounts.pageCount}
/>
<PageLayout title="Accounts" size="xl">
	<svelte:fragment slot="right">
		<Button
			href={urlGenerator({ address: '/(loggedIn)/accounts/create' }).url}
			class="flex self-center"
			color="light"
			outline
		>
			Create
		</Button>
	</svelte:fragment>
	<JournalSummaryPopoverContent
		item={data.accountSummary}
		summaryFilter={{ account: $urlStore.searchParams } || defaultJournalFilter}
		showJournalLink
	/>
	<CustomTable
		highlightText={$urlStore.searchParams?.accountTitleCombined}
		highlightTextColumns={['title', 'accountGroup', 'accountGroup2', 'accountGroup3']}
		filterText={data.filterText}
		onSortURL={(newSort) => urlInfo.updateParams({ searchParams: { orderBy: newSort } }).url}
		paginationInfo={{
			page: data.accounts.page,
			count: data.accounts.count,
			perPage: data.accounts.pageSize,
			buttonCount: 5,
			urlForPage: (value) => urlInfo.updateParams({ searchParams: { page: value } }).url
		}}
		noneFoundText="No Matching Accounts Found"
		data={data.accounts.data}
		currentOrder={data.searchParams?.orderBy}
		currentFilter={data.searchParams}
		filterModalTitle="Filter Accounts"
		bind:filterOpened
		columns={[
			{ id: 'actions', title: '' },
			{
				id: 'accountGroup',
				title: 'Account Group',
				rowToDisplay: (row) => row.accountGroup,
				sortKey: 'accountGroup'
			},
			{
				id: 'accountGroup2',
				title: 'Account Group 2',
				rowToDisplay: (row) => row.accountGroup2,
				sortKey: 'accountGroup2'
			},
			{
				id: 'accountGroup3',
				title: 'Account Group 3',
				rowToDisplay: (row) => row.accountGroup3,
				sortKey: 'accountGroup3'
			},
			{
				id: 'type',
				title: 'Type',
				rowToDisplay: (row) => accountTypeToDisplay(row.type),
				sortKey: 'type'
			},
			{
				id: 'status',
				title: 'Status',
				rowToDisplay: (row) => statusToDisplay(row.status),
				sortKey: 'status'
			},
			{ id: 'title', title: 'Title', rowToDisplay: (row) => row.title, sortKey: 'title' },
			{
				id: 'isCash',
				title: 'Cash',
				rowToDisplay: (row) => (row.isCash ? 'Y' : ''),
				sortKey: 'isCash'
			},
			{
				id: 'isNetWorth',
				title: 'Net Worth',
				rowToDisplay: (row) => (row.isNetWorth ? 'Y' : ''),
				sortKey: 'isNetWorth'
			},
			{
				id: 'startDate',
				title: 'Start Date',
				rowToDisplay: (row) => row.startDate,
				sortKey: 'startDate'
			},
			{ id: 'endDate', title: 'End Date', rowToDisplay: (row) => row.endDate, sortKey: 'endDate' },
			...summaryColumns({ currencyFormat: $currencyFormat })
		]}
		bind:shownColumns={$accountColumnsStore}
		rowColour={(row) => (row.disabled ? 'grey' : undefined)}
		rowToId={(row) => row.id}
		bulkSelection
	>
		<svelte:fragment slot="bulkActions" let:selectedIds>
			<ButtonGroup>
				<Button
					size="xs"
					class="p-2"
					outline
					disabled={selectedIds.length === 0}
					href={urlGenerator({
						address: '/(loggedIn)/accounts/bulkEdit',
						searchParamsValue: { idArray: selectedIds }
					}).url}
				>
					<EditIcon /> Selected
				</Button>
				<Button
					size="xs"
					class="p-2"
					outline
					disabled={data.accounts.count === 0}
					href={urlGenerator({
						address: '/(loggedIn)/accounts/bulkEdit',
						searchParamsValue: { ...$urlStore.searchParams, page: 0, pageSize: 1000000 }
					}).url}
				>
					<EditIcon /> All Matching
				</Button>
			</ButtonGroup>
		</svelte:fragment>
		<svelte:fragment slot="customBodyCell" let:row={currentRow} let:currentColumn>
			{#if currentColumn.id === 'actions'}
				{@const detailURL = urlGenerator({
					address: '/(loggedIn)/accounts/bulkEdit',
					searchParamsValue: { id: currentRow.id }
				}).url}

				{@const deleteURL = urlGenerator({
					address: '/(loggedIn)/accounts/[id]/delete',
					paramsValue: { id: currentRow.id }
				}).url}
				{@const journalsURL = urlGenerator({
					address: '/(loggedIn)/journals',
					searchParamsValue: {
						...defaultJournalFilter(),
						account: {
							id: currentRow.id,
							type: [...accountTypeEnum]
						}
					}
				}).url}
				<div class="flex flex-row justify-center">
					<form method="POST" action="?/update" use:enhance>
						<input type="hidden" name="id" value={currentRow.id} />
						<ButtonGroup>
							<Button href={journalsURL} class="p-2" outline color="blue">
								<JournalEntryIcon height={15} width={15} />
							</Button>
							<Button href={detailURL} class="p-2" outline>
								<EditIcon height={15} width={15} />
							</Button>
							{#if currentRow.disabled}
								<Button type="submit" name="status" value="active" class="p-2" color="primary">
									<DisabledIcon />
								</Button>
							{:else}
								<Button type="submit" name="status" value="disabled" class="p-2" outline>
									<DisabledIcon />
								</Button>
							{/if}
							<Button
								href={deleteURL}
								class="p-2"
								outline
								color="red"
								disabled={(currentRow.count || 0) > 0}
							>
								<DeleteIcon height={15} width={15} />
							</Button>
							<RawDataModal data={currentRow} title="Raw Account Data" dev={data.dev} />
						</ButtonGroup>
					</form>
				</div>
			{/if}
		</svelte:fragment>
		<svelte:fragment slot="filterButtons">
			<DownloadDropdown
				urlGenerator={(downloadType) =>
					urlGenerator({
						address: '/(loggedIn)/accounts/download',
						searchParamsValue: { ...$urlStore.searchParams, downloadType }
					}).url}
			/>
		</svelte:fragment>
		<svelte:fragment slot="filter">
			<div class="flex flex-row gap-2">
				{#if $urlStore.searchParams}
					<Input
						type="text"
						bind:value={$urlStore.searchParams.accountTitleCombined}
						placeholder="Filter by Title"
						class="flex flex-grow"
					/>
					<div class="flex self-center">
						<AccountTypeFilterLinks
							type={$urlStore.searchParams.type}
							generateURL={(newType) =>
								urlInfo.updateParams({ searchParams: { type: newType } }).url}
						/>
					</div>
				{/if}
			</div>
		</svelte:fragment>
		<svelte:fragment slot="filterModal">
			<AccountFilter bind:filter={$urlStore.searchParams} accountDetails={data.accountDropdown} />
		</svelte:fragment>
	</CustomTable>
</PageLayout>
