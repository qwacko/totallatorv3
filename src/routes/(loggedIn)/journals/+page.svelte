<script lang="ts">
	import PageLayout from '$lib/components/PageLayout.svelte';
	import { page } from '$app/stores';
	import { pageInfo, pageInfoStore, urlGenerator } from '$lib/routes.js';
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import TablePagination from '$lib/components/TablePagination.svelte';
	import {
		Alert,
		Badge,
		Button,
		ButtonGroup,
		Table,
		TableBody,
		TableBodyCell,
		TableBodyRow,
		TableHead,
		TableHeadCell
	} from 'flowbite-svelte';
	import CategoryIcon from '$lib/components/icons/CategoryIcon.svelte';
	import TagIcon from '$lib/components/icons/TagIcon.svelte';
	import BillIcon from '$lib/components/icons/BillIcon.svelte';
	import DisplayCurrency from './DisplayCurrency.svelte';
	import OrderDropDown from '$lib/components/OrderDropDown.svelte';
	import { journalOrderByEnum, journalOrderByEnumToText } from '$lib/schema/journalSchema';
	import EditIcon from '$lib/components/icons/EditIcon.svelte';
	import { enhance } from '$app/forms';

	export let data;

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
</script>

<PageLayout title="Journals" size="xl">
	<Button href={urlGenerator({ address: '/(loggedIn)/tags/create' }).url}>
		Create Transaction
	</Button>
	<center>
		<TablePagination
			count={data.journals.count}
			page={data.journals.page}
			perPage={data.journals.pageSize}
			urlForPage={(value) => urlInfo.updateParams({ searchParams: { page: value } }).url}
			buttonCount={5}
		/>
	</center>
	{#if $urlStore.searchParams}
		<OrderDropDown
			currentSort={$urlStore.searchParams.orderBy || []}
			options={[...journalOrderByEnum]}
			onSortURL={(newSort) => urlInfo.updateParams({ searchParams: { orderBy: newSort } }).url}
			optionToTitle={journalOrderByEnumToText}
		/>
	{/if}
	{#if data.journals.count === 0}
		<Alert color="dark">No Matching Journals Found</Alert>
	{:else}
		<Table>
			<TableHead>
				<TableHeadCell></TableHeadCell>
				<TableHeadCell>Actions</TableHeadCell>
				<TableHeadCell>Date</TableHeadCell>
				<TableHeadCell>Account</TableHeadCell>
				<TableHeadCell>Payee(s)</TableHeadCell>
				<TableHeadCell>Description</TableHeadCell>
				<TableHeadCell>Amount</TableHeadCell>
				<TableHeadCell>Total</TableHeadCell>
				<TableHeadCell>Relations</TableHeadCell>
			</TableHead>
			<TableBody>
				{#each data.journals.data as currentJournal}
					<TableBodyRow class={currentJournal.complete && 'bg-gray-100'}>
						<TableBodyCell></TableBodyCell>
						<TableBodyCell>
							<form action="?/update" method="post" use:enhance>
								<input type="hidden" value={currentJournal.id} name="journalId" />
								<ButtonGroup size="xs">
									<Button
										disabled={currentJournal.complete}
										href={urlGenerator({
											address: '/(loggedIn)/journals/[id]/edit',
											paramsValue: { id: currentJournal.id },
											searchParamsValue: $urlStore.searchParams
										}).url}
										class="p-2"
									>
										<EditIcon height="15" width="15" />
									</Button>
									<Button class="p-2" type="submit" name="action" value={currentJournal.complete ? "uncomplete" : "complete"}>
										<EditIcon height="15" width="15" />
									</Button>
									<Button class="p-2" type="submit" name="action" value={currentJournal.reconciled ? "unreconcile" : "reconcile"}>
										<EditIcon height="15" width="15" />
									</Button>
									<Button class="p-2" type="submit" name="action" value={currentJournal.dataChecked ? "unchecked" : "checked"}>
										<EditIcon height="15" width="15" />
									</Button>
								</ButtonGroup>
							</form>
						</TableBodyCell>
						<TableBodyCell>{currentJournal.dateText}</TableBodyCell>
						<TableBodyCell>{currentJournal.accountTitle}</TableBodyCell>
						<TableBodyCell>
							{#if currentJournal.otherJournals.length === 1}
								{@const currentOtherJournal = currentJournal.otherJournals[0]}
								<Badge>{currentOtherJournal.accountTitle}</Badge>
							{:else}
								<div class="flex flex-col">
									{#each currentJournal.otherJournals as currentOtherJournal}
										<Badge class="flex flex-col gap-1">
											<div class="flex">
												{currentOtherJournal.accountTitle}
											</div>
											<div class="flex">
												{currentOtherJournal.amount}
											</div>
										</Badge>
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
						<TableBodyCell class="flex flex-row gap-2">
							{#if currentJournal.categoryTitle}<Badge class="flex flex-row gap-1">
									<CategoryIcon />
									{currentJournal.categoryTitle}
								</Badge>{/if}
							{#if currentJournal.tagTitle}<Badge class="flex flex-row gap-1">
									<TagIcon />
									{currentJournal.tagTitle}
								</Badge>{/if}
							{#if currentJournal.billTitle}<Badge class="flex flex-row gap-1">
									<BillIcon />
									{currentJournal.billTitle}
								</Badge>{/if}
							{#if currentJournal.budgetTitle}<Badge class="flex flex-row gap-1">
									<CategoryIcon />
									{currentJournal.budgetTitle}
								</Badge>{/if}
						</TableBodyCell>
					</TableBodyRow>
				{/each}
			</TableBody>
		</Table>
	{/if}
</PageLayout>
