<script lang="ts">
	import PageLayout from '$lib/components/PageLayout.svelte';
	import { page } from '$app/stores';
	import { pageInfo, pageInfoStore, urlGenerator } from '$lib/routes.js';
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import TablePagination from '$lib/components/TablePagination.svelte';
	import {
		Alert,
		Button,
		ButtonGroup,
		P,
		Table,
		TableBody,
		TableBodyCell,
		TableBodyRow,
		TableHead,
		TableHeadCell
	} from 'flowbite-svelte';
	import DisplayCurrency from '$lib/components/DisplayCurrency.svelte';
	import OrderDropDown from '$lib/components/OrderDropDown.svelte';
	import {
		defaultAllJournalFilter,
		defaultJournalFilter,
		journalOrderByEnum,
		journalOrderByEnumToText
	} from '$lib/schema/journalSchema';
	import EditIcon from '$lib/components/icons/EditIcon.svelte';
	import { enhance } from '$app/forms';
	import CompleteIcon from '$lib/components/icons/CompleteIcon.svelte';
	import DataCheckedIcon from '$lib/components/icons/DataCheckedIcon.svelte';
	import ReconciledIcon from '$lib/components/icons/ReconciledIcon.svelte';
	import AccountBadge from '$lib/components/AccountBadge.svelte';
	import ArrowLeftIcon from '$lib/components/icons/ArrowLeftIcon.svelte';
	import ArrowRightIcon from '$lib/components/icons/ArrowRightIcon.svelte';
	import RawDataModal from '$lib/components/RawDataModal.svelte';
	import ToggleFromArray from '$lib/components/ToggleFromArray.svelte';
	import ToggleHeader from '$lib/components/ToggleHeader.svelte';
	import CloneIcon from '$lib/components/icons/CloneIcon.svelte';
	import DeleteIcon from '$lib/components/icons/DeleteIcon.svelte';
	import FilterTextDisplay from '$lib/components/FilterTextDisplay.svelte';
	import EyeIcon from '$lib/components/icons/EyeIcon.svelte';
	import CategoryBadge from '$lib/components/CategoryBadge.svelte';
	import TagBadge from '$lib/components/TagBadge.svelte';
	import BillBadge from '$lib/components/BillBadge.svelte';
	import BudgetBadge from '$lib/components/BudgetBadge.svelte';
	import JournalSummaryPopoverContent from '$lib/components/JournalSummaryPopoverContent.svelte';
	import LabelBadge from '$lib/components/LabelBadge.svelte';

	export let data;

	let selectedIds: string[] = [];

	$: urlInfo = pageInfo('/(loggedIn)/journals', $page);

	const urlStore = pageInfoStore({
		routeId: '/(loggedIn)/journals',
		pageInfo: page,
		onUpdate: (newURL) => {
			if (browser && newURL !== urlInfo.current.url) {
				goto(newURL, { keepFocus: true, noScroll: true });
			}
		},
		updateDelay: 500
	});

	$: visibleIds = data.journals.data.map((journal) => journal.id);
</script>

<PageLayout title="Journals" size="xl">
	<svelte:fragment slot="right">
		<Button color="light" outline href={urlGenerator({ address: '/(loggedIn)/tags/create' }).url}>
			Create Transaction
		</Button>
	</svelte:fragment>
	<JournalSummaryPopoverContent
		item={data.summary}
		format={data.user?.currencyFormat || 'USD'}
		summaryFilter={$urlStore.searchParams || defaultJournalFilter}
	/>

	<center>
		<TablePagination
			count={data.journals.count}
			page={data.journals.page}
			perPage={data.journals.pageSize}
			urlForPage={(value) => urlInfo.updateParams({ searchParams: { page: value } }).url}
			buttonCount={5}
		/>
	</center>
	<div class="flex flex-row gap-2 items-center">
		<P size="sm" weight="semibold">
			Selected ({selectedIds.length})
		</P>
		<ButtonGroup>
			<Button
				color="light"
				href={urlGenerator({
					address: '/(loggedIn)/journals/bulkEdit',
					searchParamsValue: {
						idArray: selectedIds,
						...defaultAllJournalFilter
					}
				}).url}
				disabled={selectedIds.length === 0}
			>
				<EditIcon />
			</Button>
			<Button
				color="light"
				href={urlGenerator({
					address: '/(loggedIn)/journals/clone',
					searchParamsValue: {
						idArray: selectedIds,
						...defaultAllJournalFilter
					}
				}).url}
				disabled={selectedIds.length === 0}
			>
				<CloneIcon />
			</Button>
			<Button
				color="light"
				href={urlGenerator({
					address: '/(loggedIn)/journals/delete',
					searchParamsValue: {
						idArray: selectedIds,
						...defaultAllJournalFilter
					}
				}).url}
				disabled={selectedIds.length === 0}
			>
				<DeleteIcon />
			</Button>
			<Button
				color="light"
				href={urlGenerator({
					address: '/(loggedIn)/journals',
					searchParamsValue: {
						...defaultJournalFilter,
						idArray: selectedIds,
						account: {}
					}
				}).url}
				disabled={selectedIds.length === 0}
			>
				<EyeIcon />
			</Button>
		</ButtonGroup>

		<P size="sm" weight="semibold">
			All ({data.journals.count})
		</P>
		<ButtonGroup>
			<Button
				color="light"
				href={urlGenerator({
					address: '/(loggedIn)/journals/bulkEdit',
					searchParamsValue: $urlStore.searchParams
				}).url}
				disabled={data.journals.count === 0}
			>
				<EditIcon />
			</Button>
			<Button
				color="light"
				href={urlGenerator({
					address: '/(loggedIn)/journals/clone',
					searchParamsValue: $urlStore.searchParams
				}).url}
				disabled={data.journals.count === 0}
			>
				<CloneIcon />
			</Button>
			<Button
				color="light"
				href={urlGenerator({
					address: '/(loggedIn)/journals/delete',
					searchParamsValue: $urlStore.searchParams
				}).url}
				disabled={data.journals.count === 0}
			>
				<DeleteIcon />
			</Button>
		</ButtonGroup>
		<div class="flex flex-grow" />
		<!-- <JournalSummary
			id=""
			items={data.deferred.summary}
			format={data.user?.currencyFormat || 'USD'}
			summaryTitle="Journal Summary"
			summaryFilter={$urlStore.searchParams || defaultJournalFilter}
		/> -->
		{#if $urlStore.searchParams}
			<OrderDropDown
				currentSort={$urlStore.searchParams.orderBy || []}
				options={[...journalOrderByEnum]}
				onSortURL={(newSort) => urlInfo.updateParams({ searchParams: { orderBy: newSort } }).url}
				optionToTitle={journalOrderByEnumToText}
			/>
		{/if}
	</div>
	<FilterTextDisplay text={data.filterText} />
	{#if data.journals.count === 0}
		<Alert color="dark">No Matching Journals Found</Alert>
	{:else}
		<Table>
			<TableHead>
				<TableHeadCell class="flex flex-row gap-1 justify-center">
					<ToggleHeader bind:selectedIds {visibleIds} onlyVisibleAllowed={true} />
				</TableHeadCell>
				<TableHeadCell>Actions</TableHeadCell>
				<TableHeadCell>Date</TableHeadCell>
				<TableHeadCell>Account</TableHeadCell>
				<TableHeadCell></TableHeadCell>
				<TableHeadCell>Payee(s)</TableHeadCell>
				<TableHeadCell>Description</TableHeadCell>
				<TableHeadCell>Amount</TableHeadCell>
				<TableHeadCell>Total</TableHeadCell>
				<TableHeadCell>Relations</TableHeadCell>
			</TableHead>
			<TableBody>
				{#each data.journals.data as currentJournal}
					<TableBodyRow class={currentJournal.complete && 'bg-gray-100'}>
						<TableBodyCell>
							<ToggleFromArray id={currentJournal.id} bind:selectedIds />
						</TableBodyCell>
						<TableBodyCell>
							<form action="?/update" method="post" use:enhance>
								<input type="hidden" value={currentJournal.id} name="journalId" />
								<ButtonGroup size="xs">
									<Button
										disabled={currentJournal.complete}
										href={urlGenerator({
											address: '/(loggedIn)/journals/bulkEdit',
											searchParamsValue: {
												idArray: [currentJournal.id],
												...defaultAllJournalFilter
											}
										}).url}
										class="p-2"
									>
										<EditIcon height="15" width="15" />
									</Button>
									<Button
										disabled={currentJournal.complete}
										href={urlGenerator({
											address: '/(loggedIn)/journals/clone',
											searchParamsValue: {
												idArray: [currentJournal.id],
												...defaultAllJournalFilter
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
												...defaultAllJournalFilter
											}
										}).url}
										class="p-2"
									>
										<DeleteIcon height="15" width="15" />
									</Button>
									{#if currentJournal.complete}
										<Button
											class="p-2"
											type="submit"
											name="action"
											color="primary"
											value="uncomplete"
										>
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
						</TableBodyCell>
						<TableBodyCell>{currentJournal.dateText}</TableBodyCell>
						<TableBodyCell>
							<AccountBadge
								accountInfo={{
									type: currentJournal.accountType,
									title: currentJournal.accountTitle,
									id: currentJournal.accountId,
									accountGroupCombinedTitle: currentJournal.accountGroup
								}}
								currentFilter={$urlStore.searchParams || defaultJournalFilter}
							/>
						</TableBodyCell>
						<TableBodyCell>
							{#if currentJournal.amount > 0}
								<ArrowLeftIcon />
							{:else}
								<ArrowRightIcon />
							{/if}
						</TableBodyCell>
						<TableBodyCell>
							{#if currentJournal.otherJournals.length === 1}
								{@const currentOtherJournal = currentJournal.otherJournals[0]}
								<AccountBadge
									accountInfo={{
										type: currentOtherJournal.accountType,
										title: currentOtherJournal.accountTitle,
										id: currentOtherJournal.accountId,
										accountGroupCombinedTitle: currentOtherJournal.accountGroup
									}}
									currentFilter={$urlStore.searchParams || defaultJournalFilter}
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
											currentFilter={$urlStore.searchParams || defaultJournalFilter}
											payeeFilter
										/>
									{/each}
								</div>
							{/if}
						</TableBodyCell>
						<TableBodyCell>{currentJournal.description}</TableBodyCell>
						<TableBodyCell>
							<div class="text-right">
								<DisplayCurrency
									format={data.user?.currencyFormat || 'USD'}
									amount={currentJournal.amount}
								/>
							</div>
						</TableBodyCell>
						<TableBodyCell>
							<div class="text-right">
								<DisplayCurrency
									format={data.user?.currencyFormat || 'USD'}
									amount={currentJournal.total}
								/>
							</div>
						</TableBodyCell>
						<TableBodyCell class="flex flex-row flex-wrap gap-2">
							<CategoryBadge
								data={currentJournal}
								currentFilter={$urlStore.searchParams || defaultJournalFilter}
							/>
							<TagBadge
								data={currentJournal}
								currentFilter={$urlStore.searchParams || defaultJournalFilter}
							/>
							<BillBadge
								data={currentJournal}
								currentFilter={$urlStore.searchParams || defaultJournalFilter}
							/>
							<BudgetBadge
								data={currentJournal}
								currentFilter={$urlStore.searchParams || defaultJournalFilter}
							/>
							{#each currentJournal.labels as currentLabel}
								<LabelBadge
									data={currentLabel}
									currentFilter={$urlStore.searchParams || defaultJournalFilter}
								/>
							{/each}
						</TableBodyCell>
					</TableBodyRow>
				{/each}
			</TableBody>
		</Table>
	{/if}
</PageLayout>
