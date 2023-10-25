<script lang="ts">
	import {
		Button,
		ButtonGroup,
		Input,
		Table,
		TableBody,
		TableBodyCell,
		TableBodyRow,
		TableHead,
		TableHeadCell,
		Alert
	} from 'flowbite-svelte';
	import PageLayout from '$lib/components/PageLayout.svelte';
	import { statusToDisplay } from '$lib/schema/statusSchema';
	import EditIcon from '$lib/components/icons/EditIcon.svelte';
	import DeleteIcon from '$lib/components/icons/DeleteIcon.svelte';
	import { page } from '$app/stores';
	import { pageInfo, pageInfoStore, urlGenerator } from '$lib/routes.js';
	import { getOrderBy, modifyOrderBy } from '$lib/helpers/orderByHelper.js';
	import SortIcon from '$lib/components/SortIcon.svelte';
	import TablePagination from '$lib/components/TablePagination.svelte';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import RawDataModal from '$lib/components/RawDataModal.svelte';
	import { defaultJournalFilter } from '$lib/schema/journalSchema.js';
	import JournalEntryIcon from '$lib/components/icons/JournalEntryIcon.svelte';
	import FilterTextDisplay from '$lib/components/FilterTextDisplay.svelte';
	import DisplayCurrency from '$lib/components/DisplayCurrency.svelte';
	import JournalSummaryPopoverContent from '$lib/components/JournalSummaryPopoverContent.svelte';
	import CustomHeader from '$lib/components/CustomHeader.svelte';
	import DownloadDropdown from '$lib/components/DownloadDropdown.svelte';

	export let data;
	$: urlInfo = pageInfo('/(loggedIn)/budgets', $page);

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

<CustomHeader
	pageTitle="Journals"
	filterText={data.filterText}
	pageNumber={data.budgets.page}
	numPages={data.budgets.pageCount}
/>

<PageLayout title="Budgets" size="lg">
	<svelte:fragment slot="right">
		<Button
			href={urlGenerator({ address: '/(loggedIn)/budgets/create' }).url}
			color="light"
			outline
		>
			Create
		</Button>
	</svelte:fragment>
	<JournalSummaryPopoverContent
		item={data.budgetSummary}
		format={data.user?.currencyFormat || 'USD'}
		summaryFilter={{ budget: $urlStore.searchParams } || defaultJournalFilter}
		showJournalLink
	/>
	<center>
		<TablePagination
			count={data.budgets.count}
			page={data.budgets.page}
			perPage={data.budgets.pageSize}
			urlForPage={(value) => urlInfo.updateParams({ searchParams: { page: value } }).url}
			buttonCount={5}
		/>
	</center>
	<div class="flex flex-row gap-2">
		{#if $urlStore.searchParams}
			<Input type="text" bind:value={$urlStore.searchParams.title} class="flex flex-grow" />
			<DownloadDropdown
				urlGenerator={(downloadType) =>
					urlGenerator({
						address: '/(loggedIn)/budgets/download',
						searchParamsValue: { ...$urlStore.searchParams, downloadType }
					}).url}
			/>
		{/if}
	</div>
	<FilterTextDisplay text={data.filterText} />

	{#if data.budgets.count === 0}
		<Alert color="dark">No Matching Budgets Found</Alert>
	{:else}
		<Table>
			<TableHead>
				<TableHeadCell></TableHeadCell>
				<TableHeadCell>
					<div class="flex flex-row gap-2 items-center">
						<div class="flex">Title</div>
						<div class="flex">
							<Button
								href={urlInfo.updateParams({
									searchParams: { orderBy: modifyOrderBy(data.searchParams?.orderBy, 'title') }
								}).url}
								class="p-1 border-0"
								outline
							>
								<SortIcon direction={getOrderBy(data.searchParams?.orderBy, 'title')} />
							</Button>
						</div>
					</div>
				</TableHeadCell>

				<TableHeadCell>
					<div class="flex flex-row gap-2 items-center">
						<div class="flex">Status</div>
						<div class="flex">
							<Button
								href={urlInfo.updateParams({
									searchParams: { orderBy: modifyOrderBy(data.searchParams?.orderBy, 'status') }
								}).url}
								class="p-1 border-0"
								outline
							>
								<SortIcon direction={getOrderBy(data.searchParams?.orderBy, 'status')} />
							</Button>
						</div>
					</div>
				</TableHeadCell>
				<TableHeadCell>Total</TableHeadCell>
				<TableHeadCell>Count</TableHeadCell>
			</TableHead>
			<TableBody>
				{#each data.budgets.data as currentBudget}
					{@const detailURL = urlGenerator({
						address: '/(loggedIn)/budgets/[id]',
						paramsValue: { id: currentBudget.id }
					}).url}

					{@const deleteURL = urlGenerator({
						address: '/(loggedIn)/budgets/[id]/delete',
						paramsValue: { id: currentBudget.id }
					}).url}
					{@const journalsURL = urlGenerator({
						address: '/(loggedIn)/journals',
						searchParamsValue: {
							...defaultJournalFilter(),
							budget: {
								id: currentBudget.id
							}
						}
					}).url}
					<TableBodyRow>
						<TableBodyCell>
							<div class="flex flex-row justify-center">
								<ButtonGroup>
									<Button href={journalsURL} class="p-2" outline color="blue">
										<JournalEntryIcon height={15} width={15} />
									</Button>
									<Button href={detailURL} class="p-2" outline>
										<EditIcon height={15} width={15} />
									</Button>
									<Button href={deleteURL} class="p-2" outline color="red">
										<DeleteIcon height={15} width={15} />
									</Button>

									<RawDataModal data={currentBudget} title="Raw Budget Data" dev={data.dev} />
								</ButtonGroup>
							</div>
						</TableBodyCell>
						<TableBodyCell>{currentBudget.title}</TableBodyCell>
						<TableBodyCell>{statusToDisplay(currentBudget.status)}</TableBodyCell>
						<TableBodyCell>
							<DisplayCurrency
								amount={currentBudget.sum}
								format={data.user?.currencyFormat || 'USD'}
							/>
						</TableBodyCell>
						<TableBodyCell>{currentBudget.count}</TableBodyCell>
					</TableBodyRow>
				{/each}
			</TableBody>
		</Table>
	{/if}
	<center>
		<TablePagination
			count={data.budgets.count}
			page={data.budgets.page}
			perPage={data.budgets.pageSize}
			urlForPage={(value) => urlInfo.updateParams({ searchParams: { page: value } }).url}
			buttonCount={5}
		/>
	</center>
</PageLayout>
