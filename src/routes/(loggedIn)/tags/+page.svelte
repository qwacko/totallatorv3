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
	import { tagColumnsStore } from '$lib/stores/columnDisplayStores.js';
	import TagFilter from '$lib/components/filters/TagFilter.svelte';
	import { enhance } from '$app/forms';
	import DisabledIcon from '$lib/components/icons/DisabledIcon.svelte';
	import { summaryColumns } from '$lib/schema/summarySchema.js';
	import JournalSummaryWithFetch from '$lib/components/JournalSummaryWithFetch.svelte';
	import AssociatedInfoButtonPromise from '$lib/components/AssociatedInfoButtonPromise.svelte';

	const { data } = $props();
	const urlInfo = $derived(pageInfo('/(loggedIn)/tags', $page));

	const urlStore = pageInfoStore({
		routeId: '/(loggedIn)/tags',
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
	pageTitle="Tags"
	filterText={data.filterText}
	pageNumber={data.tags.page}
	numPages={data.tags.pageCount}
/>

<PageLayout title="Tags" size="xl">
	{#snippet slotRight()}
		<Button color="light" outline href={urlGenerator({ address: '/(loggedIn)/tags/create' }).url}>
			Create
		</Button>
	{/snippet}
	<JournalSummaryWithFetch filter={{ tag: data.searchParams }} latestUpdate={data.latestUpdate} />
	{#if $urlStore.searchParams && data.searchParams}
		<CustomTable
			highlightText={$urlStore.searchParams?.title}
			highlightTextColumns={['title', 'group', 'single']}
			filterText={data.filterText}
			onSortURL={(newSort) => urlInfo.updateParams({ searchParams: { orderBy: newSort } }).url}
			paginationInfo={{
				page: data.tags.page,
				count: data.tags.count,
				perPage: data.tags.pageSize,
				buttonCount: 5,
				urlForPage: (value) => urlInfo.updateParams({ searchParams: { page: value } }).url
			}}
			noneFoundText="No Matching Tags Found"
			data={data.tags.data}
			currentOrder={data.searchParams?.orderBy}
			currentFilter={data.searchParams}
			filterModalTitle="Filter Tags"
			bind:numberRows={$urlStore.searchParams.pageSize}
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
			bind:shownColumns={$tagColumnsStore}
			rowColour={(row) => (row.disabled ? 'grey' : undefined)}
		>
			{#snippet slotCustomBodyCell({ row: currentRow, currentColumn })}
				{#if currentColumn.id === 'actions'}
					{@const detailURL = urlGenerator({
						address: '/(loggedIn)/tags/[id]',
						paramsValue: { id: currentRow.id }
					}).url}

					{@const deleteURL = urlGenerator({
						address: '/(loggedIn)/tags/[id]/delete',
						paramsValue: { id: currentRow.id }
					}).url}
					{@const journalsURL = urlGenerator({
						address: '/(loggedIn)/journals',
						searchParamsValue: {
							...defaultJournalFilter(),
							tag: { id: currentRow.id }
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
								<AssociatedInfoButtonPromise
									data={currentRow.associated}
									target={{ tagId: currentRow.id }}
									id={currentRow.id}
								/>
								<RawDataModal data={currentRow} title="Raw Tag Data" dev={data.dev} />
							</ButtonGroup>
						</form>
					</div>
				{/if}
			{/snippet}
			{#snippet slotFilterButtons()}
				<DownloadDropdown
					urlGenerator={(downloadType) =>
						urlGenerator({
							address: '/(loggedIn)/tags/download',
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
				<TagFilter bind:filter={$urlStore.searchParams} />
			{/snippet}
		</CustomTable>{/if}
</PageLayout>
