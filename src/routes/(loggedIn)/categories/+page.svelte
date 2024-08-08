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
	import { defaultJournalFilter } from '$lib/schema/journalSchema.js';
	import JournalEntryIcon from '$lib/components/icons/JournalEntryIcon.svelte';
	import CustomHeader from '$lib/components/CustomHeader.svelte';
	import DownloadDropdown from '$lib/components/DownloadDropdown.svelte';
	import CustomTable from '$lib/components/table/CustomTable.svelte';
	import { categoryColumnsStore } from '$lib/stores/columnDisplayStores.js';
	import CategoryFilter from '$lib/components/filters/CategoryFilter.svelte';
	import { enhance } from '$app/forms';
	import DisabledIcon from '$lib/components/icons/DisabledIcon.svelte';
	import { summaryColumns } from '$lib/schema/summarySchema.js';
	import NotesButton from '$lib/components/NotesButton.svelte';
	import FilesButton from '$lib/components/FilesButton.svelte';
	import JournalSummaryWithFetch from '$lib/components/JournalSummaryWithFetch.svelte';

	const {data} = $props()
	const urlInfo = $derived(pageInfo('/(loggedIn)/categories', $page));

	const urlStore = pageInfoStore({
		routeId: '/(loggedIn)/categories',
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
	pageTitle="Categories"
	filterText={data.filterText}
	pageNumber={data.categories.page}
	numPages={data.categories.pageCount}
/>

<PageLayout title="Categories" size="xl">
	<svelte:fragment slot="right">
		<Button
			color="light"
			outline
			href={urlGenerator({ address: '/(loggedIn)/categories/create' }).url}
		>
			Create
		</Button>
	</svelte:fragment>
	<JournalSummaryWithFetch
		filter={{ category: data.searchParams }}
		latestUpdate={data.latestUpdate}
	/>
	{#if $urlStore.searchParams && data.searchParams}
		<CustomTable
			highlightText={$urlStore.searchParams?.title}
			highlightTextColumns={['title', 'group', 'single']}
			filterText={data.filterText}
			onSortURL={(newSort) => urlInfo.updateParams({ searchParams: { orderBy: newSort } }).url}
			paginationInfo={{
				page: data.categories.page,
				count: data.categories.count,
				perPage: data.categories.pageSize,
				buttonCount: 5,
				urlForPage: (value) => urlInfo.updateParams({ searchParams: { page: value } }).url
			}}
			noneFoundText="No Matching Categories Found"
			data={data.categories.data}
			currentOrder={data.searchParams?.orderBy}
			currentFilter={data.searchParams}
			bind:numberRows={$urlStore.searchParams.pageSize}
			filterModalTitle="Filter Categories"
			bind:filterOpened
			columns={[
				{ id: 'actions', title: '' },
				{
					id: 'group',
					title: 'Group',
					rowToDisplay: (row) => row.group,
					sortKey: 'group',
					showTitleOnMobile: true
				},
				{
					id: 'single',
					title: 'Single',
					rowToDisplay: (row) => row.single,
					sortKey: 'single',
					showTitleOnMobile: true
				},
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
			bind:shownColumns={$categoryColumnsStore}
			rowColour={(row) => (row.disabled ? 'grey' : undefined)}
		>
			<svelte:fragment slot="customBodyCell" let:row={currentRow} let:currentColumn>
				{#if currentColumn.id === 'actions'}
					{@const detailURL = urlGenerator({
						address: '/(loggedIn)/categories/[id]',
						paramsValue: { id: currentRow.id }
					}).url}

					{@const deleteURL = urlGenerator({
						address: '/(loggedIn)/categories/[id]/delete',
						paramsValue: { id: currentRow.id }
					}).url}
					{@const journalsURL = urlGenerator({
						address: '/(loggedIn)/journals',
						searchParamsValue: {
							...defaultJournalFilter(),
							category: { id: currentRow.id }
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
								<NotesButton notes={currentRow.notes} target={{ categoryId: currentRow.id }} />
								<FilesButton files={currentRow.files} target={{ categoryId: currentRow.id }} />
								<RawDataModal data={currentRow} title="Raw Category Data" dev={data.dev} />
							</ButtonGroup>
						</form>
					</div>
				{/if}
			</svelte:fragment>
			<svelte:fragment slot="filterButtons">
				<DownloadDropdown
					urlGenerator={(downloadType) =>
						urlGenerator({
							address: '/(loggedIn)/categories/download',
							searchParamsValue: { ...$urlStore.searchParams, downloadType }
						}).url}
				/>
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
			<svelte:fragment slot="filterModal">
				<CategoryFilter
					bind:filter={$urlStore.searchParams}
				/>
			</svelte:fragment>
		</CustomTable>{/if}
</PageLayout>
