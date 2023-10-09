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

<PageLayout title="Budgets" size="lg">
	<Button href={urlGenerator({ address: '/(loggedIn)/budgets/create' }).url}>Create</Button>
	<center>
		<TablePagination
			count={data.budgets.count}
			page={data.budgets.page}
			perPage={data.budgets.pageSize}
			urlForPage={(value) => urlInfo.updateParams({ searchParams: { page: value } }).url}
			buttonCount={5}
		/>
	</center>
	<div>
		{#if $urlStore.searchParams}
			<Input type="text" bind:value={$urlStore.searchParams.title} />
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
				<TableHeadCell>Journals</TableHeadCell>
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
					<TableBodyRow>
						<TableBodyCell>
							<ButtonGroup class="w-full justify-center">
								<Button href={detailURL} class="p-2" outline>
									<EditIcon height={15} width={15} />
								</Button>
								<Button href={deleteURL} class="p-2" outline color="red">
									<DeleteIcon height={15} width={15} />
								</Button>

								<RawDataModal data={currentBudget} title="Raw Budget Data" dev={data.dev} />
							</ButtonGroup>
						</TableBodyCell>
						<TableBodyCell>{currentBudget.title}</TableBodyCell>
						<TableBodyCell>{statusToDisplay(currentBudget.status)}</TableBodyCell>
						<TableBodyCell>
							<Button
								outline
								href={urlGenerator({
									address: '/(loggedIn)/journals',
									searchParamsValue: {
										budget: { id: currentBudget.id },
										...defaultJournalFilter
									}
								}).url}
								size="xs"
							>
								<JournalEntryIcon />
							</Button>
						</TableBodyCell>
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
