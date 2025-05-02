<script lang="ts">
	import { Badge, Button, } from 'flowbite-svelte';
	import PageLayout from '$lib/components/PageLayout.svelte';
	import { page } from '$app/stores';
	import { pageInfo, pageInfoStore, urlGenerator } from '$lib/routes.js';
	import { goto, onNavigate } from '$app/navigation';
	import { browser } from '$app/environment';
	import RawDataModal from '$lib/components/RawDataModal.svelte';
	import JournalEntryIcon from '$lib/components/icons/JournalEntryIcon.svelte';
	import CustomHeader from '$lib/components/CustomHeader.svelte';
	import CustomTable from '$lib/components/table/CustomTable.svelte';
	import { associatedInfoColumnsStore } from '$lib/stores/columnDisplayStores.js';
	import BudgetIcon from '$lib/components/icons/BudgetIcon.svelte';
	import BillIcon from '$lib/components/icons/BillIcon.svelte';
	import LabelIcon from '$lib/components/icons/LabelIcon.svelte';
	import TagIcon from '$lib/components/icons/TagIcon.svelte';
	import CategoryIcon from '$lib/components/icons/CategoryIcon.svelte';
	import AccountIcon from '$lib/components/icons/AccountIcon.svelte';

	const { data } = $props();
	const urlInfo = $derived(pageInfo('/(loggedIn)/associated', $page));

	const urlStore = pageInfoStore({
		routeId: '/(loggedIn)/associated',
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
	pageTitle="Associated Info"
	filterText={data.filterText}
	pageNumber={data.data.page}
	numPages={data.data.pageCount}
/>

<PageLayout title="Associated Info" size="xl">
	{#snippet slotRight()}
		<Button href={urlGenerator({ address: '/(loggedIn)/bills/create' }).url} color="light" outline>
			Create
		</Button>
	{/snippet}
	{#if $urlStore.searchParams && data.searchParams}
		<CustomTable
			filterText={data.filterText}
			onSortURL={(newSort) => urlInfo.updateParams({ searchParams: { orderBy: newSort } }).url}
			paginationInfo={{
				page: data.data.page,
				count: data.data.count,
				perPage: data.data.pageSize,
				buttonCount: 5,
				urlForPage: (value) => urlInfo.updateParams({ searchParams: { page: value } }).url
			}}
			noneFoundText="No Matching Assocaited Info Found"
			data={data.data.data}
			currentOrder={data.searchParams?.orderBy}
			currentFilter={data.searchParams}
			filterModalTitle="Filter Associated Info"
			bind:numberRows={$urlStore.searchParams.pageSize}
			bind:filterOpened
			columns={[
				{ id: 'actions', title: '' },
				{
					id: 'createdAt',
					title: 'Created',
					rowToDisplay: (row) => row.createdAt.toISOString().slice(0, 10),
					sortKey: 'createdAt',
					showTitleOnMobile: true
				},
				{
					id: 'title',
					title: 'Title',
					rowToDisplay: (row) => row.title || '',
					sortKey: 'title'
				},
				{
					id: 'links',
					title: 'Links'
				}
			]}
			bind:shownColumns={$associatedInfoColumnsStore}
		>
			{#snippet slotCustomBodyCell({ row: currentRow, currentColumn })}
				{#if currentColumn.id === 'actions'}
					<RawDataModal data={currentRow} title="Raw Associated Info Data" dev={data.dev} />
				{:else if currentColumn.id === 'links'}
					<div class="flex flex-col items-stretch gap-1">
						{#if currentRow.accountTitle}
							<Badge
								href={currentRow.accountId
									? urlGenerator({
											address: '/(loggedIn)/accounts/bulkEdit',
											searchParamsValue: { id: currentRow.accountId }
										}).url
									: undefined}
								class="flex flex-row gap-2"
							>
								<AccountIcon />{currentRow.accountTitle}
							</Badge>
						{/if}
						{#if currentRow.labelTitle}
							<Badge
								href={currentRow.labelId
									? urlGenerator({
											address: '/(loggedIn)/labels/[id]',
											paramsValue: { id: currentRow.labelId }
										}).url
									: undefined}
								class="flex flex-row gap-2"
							>
								<LabelIcon />{currentRow.labelTitle}
							</Badge>
						{/if}
						{#if currentRow.billTitle}
							<Badge
								href={currentRow.billId
									? urlGenerator({
											address: '/(loggedIn)/bills/[id]',
											paramsValue: { id: currentRow.billId }
										}).url
									: undefined}
								class="flex flex-row gap-2"
							>
								<BillIcon />{currentRow.billTitle}
							</Badge>
						{/if}
						{#if currentRow.budgetTitle}
							<Badge
								href={currentRow.budgetId
									? urlGenerator({
											address: '/(loggedIn)/budgets/[id]',
											paramsValue: { id: currentRow.budgetId }
										}).url
									: undefined}
								class="flex flex-row gap-2"
							>
								<BudgetIcon />{currentRow.budgetTitle}
							</Badge>
						{/if}
						{#if currentRow.categoryTitle}
							<Badge
								href={currentRow.categoryId
									? urlGenerator({
											address: '/(loggedIn)/categories/[id]',
											paramsValue: { id: currentRow.categoryId }
										}).url
									: undefined}
								class="flex flex-row gap-2"
							>
								<CategoryIcon />{currentRow.categoryTitle}
							</Badge>
						{/if}
						{#if currentRow.tagTitle}
							<Badge
								href={currentRow.tagId
									? urlGenerator({
											address: '/(loggedIn)/tags/[id]',
											paramsValue: { id: currentRow.tagId }
										}).url
									: undefined}
								class="flex flex-row gap-2"
							>
								<TagIcon />{currentRow.tagTitle}
							</Badge>
						{/if}
						{#if currentRow.transaction?.journals && currentRow.transaction.journals.length > 0}
							{#each currentRow.transaction.journals as journal}
								<Badge
									href={currentRow.transactionId
										? urlGenerator({
												address: '/(loggedIn)/journals',
												searchParamsValue: {
													transactionIdArray: [currentRow.transactionId],
													pageSize: 10,
													page: 0,
													orderBy: [{ field: 'date', direction: 'desc' }]
												}
											}).url
										: undefined}
									class="flex flex-row gap-2"
								>
									<JournalEntryIcon />{journal.dateText} - journal.accountTitle - {journal.description}
								</Badge>
							{/each}
						{/if}
					</div>
				{/if}
			{/snippet}
		</CustomTable>
	{/if}
</PageLayout>
