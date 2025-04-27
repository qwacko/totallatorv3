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
	import RawDataModal from '$lib/components/RawDataModal.svelte';
	import JournalEntryIcon from '$lib/components/icons/JournalEntryIcon.svelte';
	import { defaultJournalFilter } from '$lib/schema/journalSchema.js';
	import CustomHeader from '$lib/components/CustomHeader.svelte';
	import DownloadDropdown from '$lib/components/DownloadDropdown.svelte';
	import CustomTable from '$lib/components/table/CustomTable.svelte';
	import { billColumnsStore } from '$lib/stores/columnDisplayStores.js';
	import BillFilter from '$lib/components/filters/BillFilter.svelte';
	import { enhance } from '$app/forms';
	import DisabledIcon from '$lib/components/icons/DisabledIcon.svelte';
	import { summaryColumns } from '$lib/schema/summarySchema.js';
	import NotesButton from '$lib/components/NotesButton.svelte';
	import FilesButton from '$lib/components/FilesButton.svelte';
	import JournalSummaryWithFetch from '$lib/components/JournalSummaryWithFetch.svelte';
	import { formatDate } from '$lib/schema/userSchema.js';
	import { userDateFormat } from '$lib/stores/userInfoStore.js';

	const { data } = $props();
	const urlInfo = $derived(pageInfo('/(loggedIn)/bills', $page));

	const urlStore = pageInfoStore({
		routeId: '/(loggedIn)/bills',
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
</script>

<CustomHeader
	pageTitle="Bills"
	filterText={data.filterText}
	pageNumber={data.bills.page}
	numPages={data.bills.pageCount}
/>

<PageLayout title="Bills" size="xl">
	{#snippet slotRight()}
		<Button href={urlGenerator({ address: '/(loggedIn)/bills/create' }).url} color="light" outline>
			Create
		</Button>
	{/snippet}
	<JournalSummaryWithFetch filter={{ bill: data.searchParams }} latestUpdate={data.latestUpdate} />
	{#if $urlStore.searchParams && data.searchParams}
		<CustomTable
			highlightText={$urlStore.searchParams?.title}
			highlightTextColumns={['title']}
			filterText={data.filterText}
			onSortURL={(newSort) => urlInfo.updateParams({ searchParams: { orderBy: newSort } }).url}
			paginationInfo={{
				page: data.bills.page,
				count: data.bills.count,
				perPage: data.bills.pageSize,
				buttonCount: 5,
				urlForPage: (value) => urlInfo.updateParams({ searchParams: { page: value } }).url
			}}
			noneFoundText="No Matching Tags Found"
			data={data.bills.data}
			currentOrder={data.searchParams?.orderBy}
			currentFilter={data.searchParams}
			filterModalTitle="Filter Tags"
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
					id: 'status',
					title: 'Status',
					rowToDisplay: (row) => statusToDisplay(row.status),
					sortKey: 'status',
					showTitleOnMobile: true
				},
				...summaryColumns({ currencyFormat: data.user?.currencyFormat })
			]}
			bind:shownColumns={$billColumnsStore}
			rowColour={(row) => (row.disabled ? 'grey' : undefined)}
		>
			{#snippet slotCustomBodyCell({ row: currentRow, currentColumn })}
				{#if currentColumn.id === 'actions'}
					{@const detailURL = urlGenerator({
						address: '/(loggedIn)/bills/[id]',
						paramsValue: { id: currentRow.id }
					}).url}

					{@const deleteURL = urlGenerator({
						address: '/(loggedIn)/bills/[id]/delete',
						paramsValue: { id: currentRow.id }
					}).url}
					{@const journalsURL = urlGenerator({
						address: '/(loggedIn)/journals',
						searchParamsValue: {
							...defaultJournalFilter(),
							bill: { id: currentRow.id }
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
								<NotesButton
									notes={currentRow.notes}
									target={{ billId: currentRow.id }}
									filter={{
										bill: { id: currentRow.id },
										page: 0,
										pageSize: 100000,
										orderBy: [{ field: 'date', direction: 'desc' }]
									}}
									autoNoteTitle="Bill : {currentRow.title} - Journal Summary ({formatDate(
										new Date(),
										$userDateFormat
									)})"
								/>
								<FilesButton files={currentRow.files} target={{ billId: currentRow.id }} />
								<RawDataModal data={currentRow} title="Raw Bill Data" dev={data.dev} />
							</ButtonGroup>
						</form>
					</div>
				{/if}
			{/snippet}
			{#snippet slotFilterButtons()}
				<DownloadDropdown
					urlGenerator={(downloadType) =>
						urlGenerator({
							address: '/(loggedIn)/bills/download',
							searchParamsValue: { ...$urlStore.searchParams, downloadType }
						}).url}
				/>
			{/snippet}
			{#snippet slotFilter()}
				<div class="flex flex-row gap-2">
					{#if $urlStore.searchParams}
						<Input
							type="text"
							bind:value={$urlStore.searchParams.textFilter}
							placeholder="Filter..."
							class="flex grow"
						/>
					{/if}
				</div>
			{/snippet}
			{#snippet slotFilterModal()}
				<BillFilter bind:filter={$urlStore.searchParams} />
			{/snippet}
		</CustomTable>
	{/if}
</PageLayout>
