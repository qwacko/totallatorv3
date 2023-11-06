<script lang="ts">
	import PageLayout from '$lib/components/PageLayout.svelte';
	import { page } from '$app/stores';
	import { pageInfo, pageInfoStore, urlGenerator } from '$lib/routes.js';
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { Button, ButtonGroup, DropdownItem, Input } from 'flowbite-svelte';
	import { defaultAllJournalFilter, defaultJournalFilter } from '$lib/schema/journalSchema';
	import EditIcon from '$lib/components/icons/EditIcon.svelte';
	import { enhance } from '$app/forms';
	import CompleteIcon from '$lib/components/icons/CompleteIcon.svelte';
	import DataCheckedIcon from '$lib/components/icons/DataCheckedIcon.svelte';
	import ReconciledIcon from '$lib/components/icons/ReconciledIcon.svelte';
	import AccountBadge from '$lib/components/AccountBadge.svelte';
	import ArrowLeftIcon from '$lib/components/icons/ArrowLeftIcon.svelte';
	import ArrowRightIcon from '$lib/components/icons/ArrowRightIcon.svelte';
	import RawDataModal from '$lib/components/RawDataModal.svelte';
	import CloneIcon from '$lib/components/icons/CloneIcon.svelte';
	import DeleteIcon from '$lib/components/icons/DeleteIcon.svelte';
	import CategoryBadge from '$lib/components/CategoryBadge.svelte';
	import TagBadge from '$lib/components/TagBadge.svelte';
	import BillBadge from '$lib/components/BillBadge.svelte';
	import BudgetBadge from '$lib/components/BudgetBadge.svelte';
	import JournalSummaryPopoverContent from '$lib/components/JournalSummaryPopoverContent.svelte';
	import LabelBadge from '$lib/components/LabelBadge.svelte';
	import CustomHeader from '$lib/components/CustomHeader.svelte';
	import DownloadDropdown from '$lib/components/DownloadDropdown.svelte';
	import CustomTable from '$lib/components/table/CustomTable.svelte';
	import { journalColumnsStore } from '$lib/stores/columnDisplayStores.js';
	import FilterModalContent from '$lib/components/FilterModalContent.svelte';
	import DropdownFilterNestedText from '$lib/components/table/DropdownFilterNestedText.svelte';
	import DateInput from '$lib/components/DateInput.svelte';
	import FilterDropdown from './FilterDropdown.svelte';
	import FilterCreateIcon from '$lib/components/icons/FilterCreateIcon.svelte';

	export let data;

	$: urlInfo = pageInfo('/(loggedIn)/journals', $page);

	const urlStore = pageInfoStore({
		routeId: '/(loggedIn)/journals',
		pageInfo: page,
		onUpdate: (newURL) => {
			console.log('Updating URL');
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
	pageNumber={data.journals.page}
	numPages={data.journals.pageCount}
/>

<PageLayout title="Journals" size="xl">
	<svelte:fragment slot="right">
		<Button
			color="light"
			outline
			href={urlGenerator({
				address: '/(loggedIn)/journals/create',
				searchParamsValue: $urlStore.searchParams || defaultJournalFilter()
			}).url}
		>
			Create Transaction
		</Button>
	</svelte:fragment>
	<JournalSummaryPopoverContent
		item={data.summary}
		format={data.user?.currencyFormat || 'USD'}
		summaryFilter={$urlStore.searchParams || defaultJournalFilter()}
	/>
	{#if $urlStore.searchParams && data.searchParams}
		<CustomTable
			highlightText={$urlStore.searchParams.description}
			highlightTextColumns={['description']}
			filterText={data.filterText}
			onSortURL={(newSort) => urlInfo.updateParams({ searchParams: { orderBy: newSort } }).url}
			paginationInfo={{
				page: data.journals.page,
				perPage: data.journals.pageSize,
				count: data.journals.count,
				buttonCount: 5,
				urlForPage: (value) => urlInfo.updateParams({ searchParams: { page: value } }).url
			}}
			noneFoundText="No Matching Journals Found"
			data={data.journals.data}
			currentOrder={data.searchParams.orderBy}
			currentFilter={data.searchParams}
			filterModalTitle="Filter Journals"
			bind:numberRows={$urlStore.searchParams.pageSize}
			columns={[
				{ id: 'actions', title: '' },
				{
					id: 'dateText',
					title: 'Date',
					rowToDisplay: (row) => row.dateText,
					sortKey: 'date',
					filterActive:
						Boolean($urlStore.searchParams.dateAfter) || Boolean($urlStore.searchParams.dateBefore)
				},
				{
					id: 'account',
					title: 'Account',
					enableDropdown: true,
					customCell: true,
					filterActive: Boolean($urlStore.searchParams.account?.title ? true : false)
				},
				{ id: 'direction', title: '', customCell: true },
				{
					id: 'payee',
					title: 'Payee(s)',
					enableDropdown: true,
					customCell: true,
					filterActive: Boolean($urlStore.searchParams.payee?.title ? true : false)
				},
				{
					id: 'description',
					title: 'Description',
					sortKey: 'description',
					rowToDisplay: (row) => row.description,
					filterActive: Boolean(
						$urlStore.searchParams.description && $urlStore.searchParams.description.length > 0
					)
				},
				{
					id: 'amount',
					title: 'Amount',
					sortKey: 'amount',
					customCell: true,
					rowToCurrency: (row) => ({
						amount: row.amount,
						format: data.user?.currencyFormat || 'USD'
					})
				},
				{
					id: 'total',
					title: 'Total',
					rowToCurrency: (row) => ({
						amount: row.total,
						format: data.user?.currencyFormat || 'USD'
					})
				},
				{ id: 'relations', title: 'Relations', customCell: true }
			]}
			bind:shownColumns={$journalColumnsStore}
		>
			<svelte:fragment slot="filterButtons">
				<Button
					href={urlGenerator({
						address: '/(loggedIn)/filters/create',
						searchParamsValue: {
							filter: $urlStore.searchParams
						}
					}).url}
					class="p-2"
					outline
				>
					<FilterCreateIcon />
				</Button>
				<FilterDropdown
					filters={data.filterDropdown}
					newFilter={(newFilter) =>
						urlGenerator({
							address: '/(loggedIn)/journals',
							searchParamsValue: {
								...newFilter,
								page: $urlStore.searchParams?.page || 0,
								pageSize: $urlStore.searchParams?.pageSize || 10
							}
						}).url}
					updateFilter={(newFilter) => urlInfo.updateParams({ searchParams: newFilter }).url}
				/>
				<DownloadDropdown
					urlGenerator={(downloadType) => {
						if ($urlStore.searchParams) {
							return urlGenerator({
								address: '/(loggedIn)/journals/download',
								searchParamsValue: {
									...$urlStore.searchParams,
									downloadType
								}
							}).url;
						}
						return '';
					}}
				/>
			</svelte:fragment>
			<svelte:fragment slot="filter">
				<div class="flex flex-row gap-2">
					{#if $urlStore.searchParams}
						<Input
							type="text"
							bind:value={$urlStore.searchParams.description}
							placeholder="Filter by Description"
							class="flex flex-grow"
						/>
					{/if}
				</div>
			</svelte:fragment>
			<svelte:fragment slot="filterModal">
				{#if $urlStore.searchParams}
					<FilterModalContent
						currentFilter={$urlStore.searchParams}
						accountDropdown={data.dropdownInfo.accounts}
						billDropdown={data.dropdownInfo.bills}
						budgetDropdown={data.dropdownInfo.budgets}
						categoryDropdown={data.dropdownInfo.categories}
						tagDropdown={data.dropdownInfo.tags}
						labelDropdown={data.dropdownInfo.labels}
						urlFromFilter={(newFilter) => urlInfo.updateParams({ searchParams: newFilter }).url}
					/>
				{/if}
			</svelte:fragment>
			<svelte:fragment slot="customBodyCell" let:row={currentJournal} let:currentColumn>
				{#if currentColumn.id === 'actions'}
					<form action="?/update" method="post" use:enhance>
						<input type="hidden" value={currentJournal.id} name="journalId" />
						<ButtonGroup size="xs">
							<Button
								disabled={currentJournal.complete}
								href={urlGenerator({
									address: '/(loggedIn)/journals/bulkEdit',
									searchParamsValue: {
										idArray: [currentJournal.id],
										...defaultAllJournalFilter()
									}
								}).url}
								class="p-2"
							>
								<EditIcon height="15" width="15" />
							</Button>
							<Button
								disabled={false}
								href={urlGenerator({
									address: '/(loggedIn)/journals/clone',
									searchParamsValue: {
										idArray: [currentJournal.id],
										...defaultAllJournalFilter()
									}
								}).url}
								class="p-2"
							>
								<CloneIcon height="15" width="15" />
							</Button>
							<Button
								disabled={currentJournal.complete}
								href={urlGenerator({
									address: '/(loggedIn)/journals/delete',
									searchParamsValue: {
										idArray: [currentJournal.id],
										...defaultAllJournalFilter()
									}
								}).url}
								class="p-2"
							>
								<DeleteIcon height="15" width="15" />
							</Button>
							{#if currentJournal.complete}
								<Button class="p-2" type="submit" name="action" color="primary" value="uncomplete">
									<CompleteIcon height="15" width="15" />
								</Button>
							{:else}
								<Button class="p-2" type="submit" name="action" value="complete">
									<CompleteIcon height="15" width="15" />
								</Button>
							{/if}
							{#if currentJournal.reconciled}
								<Button
									class="p-2"
									type="submit"
									name="action"
									color="primary"
									value="unreconcile"
									disabled={currentJournal.complete}
								>
									<ReconciledIcon height="15" width="15" />
								</Button>
							{:else}
								<Button
									class="p-2"
									type="submit"
									name="action"
									value="reconcile"
									disabled={currentJournal.complete}
								>
									<ReconciledIcon height="15" width="15" />
								</Button>
							{/if}

							{#if currentJournal.dataChecked}
								<Button
									class="p-2"
									type="submit"
									name="action"
									color="primary"
									value="uncheck"
									disabled={currentJournal.complete}
								>
									<DataCheckedIcon height="15" width="15" />
								</Button>
							{:else}
								<Button
									class="p-2"
									type="submit"
									name="action"
									value="check"
									disabled={currentJournal.complete}
								>
									<DataCheckedIcon height="15" width="15" />
								</Button>
							{/if}
							<RawDataModal data={currentJournal} dev={data.dev} title="Raw Journal Data" />
						</ButtonGroup>
					</form>
				{:else if currentColumn.id === 'account'}
					<AccountBadge
						accountInfo={{
							type: currentJournal.accountType,
							title: currentJournal.accountTitle,
							id: currentJournal.accountId,
							accountGroupCombinedTitle: currentJournal.accountGroup
						}}
						currentFilter={$urlStore.searchParams || defaultJournalFilter()}
					/>
				{:else if currentColumn.id === 'direction'}
					{#if currentJournal.amount > 0}
						<ArrowLeftIcon />
					{:else}
						<ArrowRightIcon />
					{/if}
				{:else if currentColumn.id === 'payee'}
					{#if currentJournal.otherJournals.length === 1}
						{@const currentOtherJournal = currentJournal.otherJournals[0]}
						<AccountBadge
							accountInfo={{
								type: currentOtherJournal.accountType,
								title: currentOtherJournal.accountTitle,
								id: currentOtherJournal.accountId,
								accountGroupCombinedTitle: currentOtherJournal.accountGroup
							}}
							currentFilter={$urlStore.searchParams || defaultJournalFilter()}
							payeeFilter
						/>
					{:else}
						<div class="flex flex-col">
							{#each currentJournal.otherJournals as currentOtherJournal}
								<AccountBadge
									accountInfo={{
										type: currentOtherJournal.accountType,
										title: currentOtherJournal.accountTitle,
										id: currentOtherJournal.accountId,
										accountGroupCombinedTitle: currentOtherJournal.accountGroup
									}}
									currentFilter={$urlStore.searchParams || defaultJournalFilter()}
									payeeFilter
								/>
							{/each}
						</div>
					{/if}
				{:else if currentColumn.id === 'relations'}
					<CategoryBadge
						data={currentJournal}
						currentFilter={$urlStore.searchParams || defaultJournalFilter()}
					/>
					<TagBadge
						data={currentJournal}
						currentFilter={$urlStore.searchParams || defaultJournalFilter()}
					/>
					<BillBadge
						data={currentJournal}
						currentFilter={$urlStore.searchParams || defaultJournalFilter()}
					/>
					<BudgetBadge
						data={currentJournal}
						currentFilter={$urlStore.searchParams || defaultJournalFilter()}
					/>
					{#each currentJournal.labels as currentLabel}
						<LabelBadge
							data={currentLabel}
							currentFilter={$urlStore.searchParams || defaultJournalFilter()}
						/>
					{/each}
				{/if}
			</svelte:fragment>
			<svelte:fragment slot="headerItem" let:currentColumn>
				{#if $urlStore.searchParams}
					{#if currentColumn.id === 'description'}
						<DropdownItem>
							<Input
								type="text"
								bind:value={$urlStore.searchParams.description}
								placeholder="Filter By Description"
							/>
						</DropdownItem>
					{:else if currentColumn.id === 'account'}
						<DropdownFilterNestedText bind:params={$urlStore.searchParams.account} key="title" />
					{:else if currentColumn.id === 'payee'}
						<DropdownFilterNestedText bind:params={$urlStore.searchParams.payee} key="title" />
					{:else if currentColumn.id === 'dateText'}
						<DropdownItem>
							<DateInput
								title="Date After"
								bind:value={$urlStore.searchParams.dateAfter}
								name=""
								errorMessage=""
							/>
						</DropdownItem>
						<DropdownItem>
							<DateInput
								title="Date Before"
								bind:value={$urlStore.searchParams.dateBefore}
								name=""
								errorMessage=""
							/>
						</DropdownItem>
					{/if}
				{/if}
			</svelte:fragment>
		</CustomTable>
	{/if}
</PageLayout>
