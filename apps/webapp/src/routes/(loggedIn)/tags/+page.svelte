<script lang="ts">
	import { Button, ButtonGroup } from 'flowbite-svelte';

	import { statusToDisplay } from '@totallator/shared';
	import { defaultJournalFilter } from '@totallator/shared';
	import { summaryColumns } from '@totallator/shared';

	import { enhance } from '$app/forms';
	import { onNavigate } from '$app/navigation';
	import { page } from '$app/state';

	import AssociatedInfoButtonPromise from '$lib/components/AssociatedInfoButtonPromise.svelte';
	import CustomHeader from '$lib/components/CustomHeader.svelte';
	import DownloadDropdown from '$lib/components/DownloadDropdown.svelte';
	import TagFilter from '$lib/components/filters/TagFilter.svelte';
	import DeleteIcon from '$lib/components/icons/DeleteIcon.svelte';
	import DisabledIcon from '$lib/components/icons/DisabledIcon.svelte';
	import EditIcon from '$lib/components/icons/EditIcon.svelte';
	import JournalEntryIcon from '$lib/components/icons/JournalEntryIcon.svelte';
	import JournalSummaryWithFetch from '$lib/components/JournalSummaryWithFetch.svelte';
	import PageLayout from '$lib/components/PageLayout.svelte';
	import RawDataModal from '$lib/components/RawDataModal.svelte';
	import SearchInput from '$lib/components/SearchInput.svelte';
	import CustomTable from '$lib/components/table/CustomTable.svelte';
	import { pageInfo, urlGenerator } from '$lib/routes.js';
	import { tagColumnsStore } from '$lib/stores/columnDisplayStores.js';

	const { data } = $props();
	const urlInfo = pageInfo('/(loggedIn)/tags', () => page);

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
	{#if urlInfo.current.searchParams && data.searchParams}
		<CustomTable
			highlightText={urlInfo.current.searchParams?.title}
			highlightTextColumns={['title', 'group', 'single']}
			filterText={data.filterText}
			onSortURL={(newSort) =>
				urlInfo.updateParamsURLGenerator({ searchParams: { orderBy: newSort } }).url}
			paginationInfo={{
				page: data.tags.page,
				count: data.tags.count,
				perPage: data.tags.pageSize,
				buttonCount: 5,
				urlForPage: (value) =>
					urlInfo.updateParamsURLGenerator({ searchParams: { page: value } }).url
			}}
			noneFoundText="No Matching Tags Found"
			data={data.tags.data}
			currentOrder={data.searchParams?.orderBy}
			currentFilter={data.searchParams}
			filterModalTitle="Filter Tags"
			bind:numberRows={urlInfo.current.searchParams.pageSize}
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
							searchParamsValue: { ...urlInfo.current.searchParams, downloadType }
						}).url}
				/>
			{/snippet}
			{#snippet slotFilter()}
				<div class="flex flex-row gap-2">
					{#if urlInfo.current.searchParams}
						<SearchInput
							type="text"
							bind:value={urlInfo.current.searchParams.textFilter}
							placeholder="Filter..."
							class="flex grow"
							keys={data.autocompleteKeys}
						/>
					{/if}
				</div>
			{/snippet}
			{#snippet slotFilterModal()}
				<TagFilter bind:filter={urlInfo.current.searchParams} />
			{/snippet}
		</CustomTable>{/if}
</PageLayout>
