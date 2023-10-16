<script lang="ts">
	import {
		Alert,
		Button,
		ButtonGroup,
		Input,
		Table,
		TableBody,
		TableBodyCell,
		TableBodyRow,
		TableHead,
		TableHeadCell
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
	import DownloadIcon from '$lib/components/icons/DownloadIcon.svelte';

	export let data;
	$: urlInfo = pageInfo('/(loggedIn)/categories', $page);

	const urlStore = pageInfoStore({
		routeId: '/(loggedIn)/categories',
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
	pageTitle="Categories"
	filterText={data.filterText}
	pageNumber={data.categories.page}
	numPages={data.categories.pageCount}
/>

<PageLayout title="Categories" size="lg">
	<svelte:fragment slot="right">
		<Button
			color="light"
			outline
			href={urlGenerator({ address: '/(loggedIn)/categories/create' }).url}
		>
			Create
		</Button>
	</svelte:fragment>
	<JournalSummaryPopoverContent
		item={data.categorySummary}
		format={data.user?.currencyFormat || 'USD'}
		summaryFilter={{ category: $urlStore.searchParams } || defaultJournalFilter}
		showJournalLink
	/>
	<center>
		<TablePagination
			count={data.categories.count}
			page={data.categories.page}
			perPage={data.categories.pageSize}
			urlForPage={(value) => urlInfo.updateParams({ searchParams: { page: value } }).url}
			buttonCount={5}
		/>
	</center>
	<div class="flex flex-row gap-2">
		{#if $urlStore.searchParams}
			<Input type="text" bind:value={$urlStore.searchParams.title} class="flex flex-grow" />
			<Button
				href={urlGenerator({
					address: '/(loggedIn)/categories/download',
					searchParamsValue: $urlStore.searchParams
				}).url}
				color="blue"
				outline
				size="sm"
			>
				<DownloadIcon />
			</Button>
		{/if}
	</div>
	<FilterTextDisplay text={data.filterText} />
	{#if data.categories.count === 0}
		<Alert color="dark">No Matching Categories Found</Alert>
	{:else}
		<Table>
			<TableHead>
				<TableHeadCell></TableHeadCell>
				<TableHeadCell>
					<div class="flex flex-row gap-2 items-center">
						<div class="flex">Group</div>
						<div class="flex">
							<Button
								href={urlInfo.updateParams({
									searchParams: { orderBy: modifyOrderBy(data.searchParams?.orderBy, 'group') }
								}).url}
								class="p-1 border-0"
								outline
							>
								<SortIcon direction={getOrderBy(data.searchParams?.orderBy, 'group')} />
							</Button>
						</div>
					</div>
				</TableHeadCell>
				<TableHeadCell>
					<div class="flex flex-row gap-2 items-center">
						<div class="flex">Single</div>
						<div class="flex">
							<Button
								href={urlInfo.updateParams({
									searchParams: { orderBy: modifyOrderBy(data.searchParams?.orderBy, 'single') }
								}).url}
								class="p-1 border-0"
								outline
							>
								<SortIcon direction={getOrderBy(data.searchParams?.orderBy, 'single')} />
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
				{#each data.categories.data as currentCategory}
					{@const detailURL = urlGenerator({
						address: '/(loggedIn)/categories/[id]',
						paramsValue: { id: currentCategory.id }
					}).url}

					{@const deleteURL = urlGenerator({
						address: '/(loggedIn)/categories/[id]/delete',
						paramsValue: { id: currentCategory.id }
					}).url}
					{@const journalsURL = urlGenerator({
						address: '/(loggedIn)/journals',
						searchParamsValue: {
							...defaultJournalFilter,
							category: {
								id: currentCategory.id
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
									<RawDataModal data={currentCategory} title="Raw Category Data" dev={data.dev} />
								</ButtonGroup>
							</div>
						</TableBodyCell>
						<TableBodyCell>{currentCategory.group}</TableBodyCell>
						<TableBodyCell>{currentCategory.single}</TableBodyCell>
						<TableBodyCell>{statusToDisplay(currentCategory.status)}</TableBodyCell>
						<TableBodyCell>
							<DisplayCurrency
								amount={currentCategory.sum}
								format={data.user?.currencyFormat || 'USD'}
							/>
						</TableBodyCell>
						<TableBodyCell>{currentCategory.count}</TableBodyCell>
					</TableBodyRow>
				{/each}
			</TableBody>
		</Table>
	{/if}
	<center>
		<TablePagination
			count={data.categories.count}
			page={data.categories.page}
			perPage={data.categories.pageSize}
			urlForPage={(value) => urlInfo.updateParams({ searchParams: { page: value } }).url}
			buttonCount={5}
		/>
	</center>
</PageLayout>
