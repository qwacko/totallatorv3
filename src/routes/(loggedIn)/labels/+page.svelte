<script lang="ts">
	import { Button, ButtonGroup, Input } from 'flowbite-svelte';
	import PageLayout from '$lib/components/PageLayout.svelte';
	import { statusToDisplay } from '$lib/schema/statusSchema';
	import EditIcon from '$lib/components/icons/EditIcon.svelte';
	import DeleteIcon from '$lib/components/icons/DeleteIcon.svelte';
	import { page } from '$app/stores';
	import { pageInfo, pageInfoStore, urlGenerator } from '$lib/routes.js';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import RawDataModal from '$lib/components/RawDataModal.svelte';
	import { defaultJournalFilter } from '$lib/schema/journalSchema.js';
	import JournalEntryIcon from '$lib/components/icons/JournalEntryIcon.svelte';
	import JournalSummaryPopoverContent from '$lib/components/JournalSummaryPopoverContent.svelte';
	import CustomHeader from '$lib/components/CustomHeader.svelte';
	import DownloadDropdown from '$lib/components/DownloadDropdown.svelte';
	import CustomTable from '$lib/components/table/CustomTable.svelte';
	import { labelColumnsStore } from '$lib/stores/columnDisplayStores.js';
	import LabelFilter from '$lib/components/filters/LabelFilter.svelte';
	import { enhance } from '$app/forms';
	import DisabledIcon from '$lib/components/icons/DisabledIcon.svelte';
	import { summaryColumns } from '$lib/schema/summarySchema';

	export let data;
	$: urlInfo = pageInfo('/(loggedIn)/labels', $page);

	const urlStore = pageInfoStore({
		routeId: '/(loggedIn)/labels',
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
	pageNumber={data.labels.page}
	numPages={data.labels.pageCount}
/>

<PageLayout title="Labels" size="xl">
	<svelte:fragment slot="right">
		<Button color="light" outline href={urlGenerator({ address: '/(loggedIn)/labels/create' }).url}>
			Create
		</Button>
	</svelte:fragment>
	<JournalSummaryPopoverContent
		item={data.labelSummary}
		format={data.user?.currencyFormat || 'USD'}
		summaryFilter={{ label: $urlStore.searchParams } || defaultJournalFilter()}
		showJournalLink
	/>
	{#if $urlStore.searchParams && data.searchParams}
		<CustomTable
			highlightText={$urlStore.searchParams?.title}
			highlightTextColumns={['title']}
			filterText={data.filterText}
			onSortURL={(newSort) => urlInfo.updateParams({ searchParams: { orderBy: newSort } }).url}
			paginationInfo={{
				page: data.labels.page,
				count: data.labels.count,
				perPage: data.labels.pageSize,
				buttonCount: 5,
				urlForPage: (value) => urlInfo.updateParams({ searchParams: { page: value } }).url
			}}
			noneFoundText="No Matching Tags Found"
			data={data.labels.data}
			currentOrder={data.searchParams?.orderBy}
			currentFilter={data.searchParams}
			filterModalTitle="Filter Tags"
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
					id: 'status',
					title: 'Status',
					rowToDisplay: (row) => statusToDisplay(row.status),
					sortKey: 'status'
				},
				...summaryColumns({ currencyFormat: data.user?.currencyFormat })
			]}
			bind:shownColumns={$labelColumnsStore}
			rowColour={(row) => (row.disabled ? 'grey' : undefined)}
		>
			<svelte:fragment slot="customBodyCell" let:row={currentRow} let:currentColumn>
				{#if currentColumn.id === 'actions'}
					{@const detailURL = urlGenerator({
						address: '/(loggedIn)/labels/[id]',
						paramsValue: { id: currentRow.id }
					}).url}

					{@const deleteURL = urlGenerator({
						address: '/(loggedIn)/labels/[id]/delete',
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
								<RawDataModal data={currentRow} title="Raw Label Data" dev={data.dev} />
							</ButtonGroup>
						</form>
					</div>
				{/if}
			</svelte:fragment>
			<svelte:fragment slot="filterButtons">
				<DownloadDropdown
					urlGenerator={(downloadType) =>
						urlGenerator({
							address: '/(loggedIn)/labels/download',
							searchParamsValue: { ...$urlStore.searchParams, downloadType }
						}).url}
				/>
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
			<svelte:fragment slot="filterModal">
				<LabelFilter bind:filter={$urlStore.searchParams} labelDetails={data.labelDropdowns} />
			</svelte:fragment>
		</CustomTable>{/if}
</PageLayout>
