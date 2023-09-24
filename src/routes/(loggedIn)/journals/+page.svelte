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
		Table,
		TableBody,
		TableBodyCell,
		TableBodyRow,
		TableHead,
		TableHeadCell
	} from 'flowbite-svelte';

	export let data;

	$: urlInfo = pageInfo('/(loggedIn)/journals', $page);

	const urlStore = pageInfoStore({
		routeId: '/(loggedIn)/budgets',
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
	<div class="flex">
		{data.journals.runningTotal}
	</div>

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
					<TableBodyRow>
						<TableBodyCell></TableBodyCell>
						<TableBodyCell></TableBodyCell>
						<TableBodyCell>{currentJournal.dateText}</TableBodyCell>
						<TableBodyCell>{currentJournal.accountTitle}</TableBodyCell>
						<TableBodyCell>{JSON.stringify(currentJournal.otherJournals)}</TableBodyCell>
						<TableBodyCell>{currentJournal.description}</TableBodyCell>
						<TableBodyCell>{currentJournal.amount}</TableBodyCell>
						<TableBodyCell>{currentJournal.total.toFixed(2)}</TableBodyCell>
						<TableBodyCell class="flex flex-col">
							{#if currentJournal.categoryTitle}<div class="flex">
									{currentJournal.categoryTitle}
								</div>{/if}
							{#if currentJournal.tagTitle}<div class="flex">{currentJournal.tagTitle}</div>{/if}
							{#if currentJournal.billTitle}<div class="flex">{currentJournal.billTitle}</div>{/if}
							{#if currentJournal.budgetTitle}<div class="flex">
									{currentJournal.budgetTitle}
								</div>{/if}
						</TableBodyCell>
					</TableBodyRow>
				{/each}
			</TableBody>
		</Table>
	{/if}
</PageLayout>
