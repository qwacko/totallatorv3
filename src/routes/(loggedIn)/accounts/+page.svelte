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
	import TablePagination from '$lib/components/TablePagination.svelte';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import OrderDropDown from '../../../lib/components/OrderDropDown.svelte';
	import { accountOrderByEnum, accountOrderByEnumToText } from '$lib/schema/accountSchema';

	import AccountTypeFilterLinks from '$lib/components/AccountTypeFilterLinks.svelte';
	import RawDataModal from '$lib/components/RawDataModal.svelte';
	import { defaultJournalFilter } from '$lib/schema/journalSchema';
	import FilterTextDisplay from '$lib/components/FilterTextDisplay.svelte';
	import { accountTypeEnum, accountTypeToDisplay } from '$lib/schema/accountTypeSchema';
	import DisplayCurrency from '$lib/components/DisplayCurrency.svelte';
	import JournalEntryIcon from '$lib/components/icons/JournalEntryIcon.svelte';
	import JournalSummaryPopoverContent from '$lib/components/JournalSummaryPopoverContent.svelte';
	import CustomHeader from '$lib/components/CustomHeader.svelte';
	import DownloadDropdown from '$lib/components/DownloadDropdown.svelte';
	import TableCustomHeadCell from '$lib/components/TableCustomHeadCell.svelte';
	import CustomTable from '$lib/components/table/CustomTable.svelte';

	export let data;
	$: urlInfo = pageInfo('/(loggedIn)/accounts', $page);

	const urlStore = pageInfoStore({
		routeId: '/(loggedIn)/accounts',
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
	pageTitle="Accounts"
	filterText={data.filterText}
	pageNumber={data.accounts.page}
	numPages={data.accounts.pageCount}
/>

<PageLayout title="Accounts" size="xl">
	<svelte:fragment slot="right">
		<Button
			href={urlGenerator({ address: '/(loggedIn)/accounts/create' }).url}
			class="flex self-center"
			color="light"
			outline
		>
			Create
		</Button>
	</svelte:fragment>
	<JournalSummaryPopoverContent
		item={data.accountSummary}
		format={data.user?.currencyFormat || 'USD'}
		summaryFilter={{ account: $urlStore.searchParams } || defaultJournalFilter}
		showJournalLink
	/>
	<center>
		<TablePagination
			count={data.accounts.count}
			page={data.accounts.page}
			perPage={data.accounts.pageSize}
			urlForPage={(value) => urlInfo.updateParams({ searchParams: { page: value } }).url}
			buttonCount={5}
		/>
	</center>
	<div class="flex flex-col gap-2">
		{#if $urlStore.searchParams}
			<Input type="text" bind:value={$urlStore.searchParams.title} class="flex flex-grow" />
			<AccountTypeFilterLinks
				type={$urlStore.searchParams.type}
				generateURL={(newType) => urlInfo.updateParams({ searchParams: { type: newType } }).url}
			/>
		{/if}
	</div>
	<div class="flex flex-row gap-2">
		<FilterTextDisplay text={data.filterText} />
		<div class="flex flex-grow items-center" />

		{#if $urlStore.searchParams}
			<OrderDropDown
				currentSort={$urlStore.searchParams.orderBy}
				options={[...accountOrderByEnum]}
				onSortURL={(newSort) => urlInfo.updateParams({ searchParams: { orderBy: newSort } }).url}
				optionToTitle={accountOrderByEnumToText}
			/>
			<DownloadDropdown
				urlGenerator={(downloadType) =>
					urlGenerator({
						address: '/(loggedIn)/accounts/download',
						searchParamsValue: { ...$urlStore.searchParams, downloadType }
					}).url}
			/>
		{/if}
	</div>
	<CustomTable
		noneFoundText="No Matching Accounts Found"
		data={data.accounts.data}
		currentOrder={data.searchParams?.orderBy}
		currentFilter={data.searchParams}
		columns={[
			{ id: 'actions', title: '' },
			{ id: 'accountGroup', title: 'Account Group', rowToDisplay: (row) => row.accountGroup },
			{ id: 'accountGroup2', title: 'Account Group 2', rowToDisplay: (row) => row.accountGroup2 },
			{ id: 'accountGroup3', title: 'Account Group 3', rowToDisplay: (row) => row.accountGroup3 },
			{ id: 'type', title: 'Type', rowToDisplay: (row) => accountTypeToDisplay(row.type) },
			{ id: 'status', title: 'Status', rowToDisplay: (row) => statusToDisplay(row.status) },
			{ id: 'title', title: 'Title', rowToDisplay: (row) => row.title },
			{ id: 'isCash', title: 'Cash', rowToDisplay: (row) => (row.isCash ? 'Y' : '') },
			{ id: 'isNetWorth', title: 'Net Worth', rowToDisplay: (row) => (row.isNetWorth ? 'Y' : '') },
			{ id: 'startDate', title: 'Start Date', rowToDisplay: (row) => row.startDate },
			{ id: 'endDate', title: 'End Date', rowToDisplay: (row) => row.endDate },
			{
				id: 'total',
				title: 'Total',
				rowToCurrency: (row) => ({ amount: row.sum, format: data.user?.currencyFormat || 'USD' })
			},
			{ id: 'count', title: 'Count', rowToDisplay: (row) => row.count.toString() }
		]}
		shownColumns={[
			'actions',
			'accountGroup',
			'accountGroup2',
			'accountGroup3',
			'title',
			'type',
			'status',
			'isCash',
			'isNetWorth',
			'startDate',
			'endDate',
			'total',
			'count'
		]}
	>
		<svelte:fragment slot="customBodyCell" let:row={currentRow} let:currentColumn>
			{#if currentColumn.id === 'actions'}
				{@const detailURL = urlGenerator({
					address: '/(loggedIn)/accounts/[id]',
					paramsValue: { id: currentRow.id }
				}).url}

				{@const deleteURL = urlGenerator({
					address: '/(loggedIn)/accounts/[id]/delete',
					paramsValue: { id: currentRow.id }
				}).url}
				{@const journalsURL = urlGenerator({
					address: '/(loggedIn)/journals',
					searchParamsValue: {
						...defaultJournalFilter(),
						account: {
							id: currentRow.id,
							type: [...accountTypeEnum]
						}
					}
				}).url}
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
						<RawDataModal data={currentRow} title="Raw Account Data" dev={data.dev} />
					</ButtonGroup>
				</div>
			{/if}
		</svelte:fragment>
	</CustomTable>
	{#if data.accounts.count === 0}
		<Alert color="dark">No Matching Accounts Found</Alert>
	{:else}
		<Table>
			<TableHead>
				<TableHeadCell></TableHeadCell>
				<TableCustomHeadCell
					title="Account Group"
					currentOrder={data.searchParams?.orderBy}
					orderKey="accountGroup"
					updateOrderByToURL={(newOrder) =>
						urlInfo.updateParams({
							searchParams: { orderBy: newOrder }
						}).url}
				/>
				<TableCustomHeadCell
					title="Account Group 2"
					currentOrder={data.searchParams?.orderBy}
					orderKey="accountGroup2"
					updateOrderByToURL={(newOrder) =>
						urlInfo.updateParams({
							searchParams: { orderBy: newOrder }
						}).url}
				/>
				<TableCustomHeadCell
					title="Account Group 3"
					currentOrder={data.searchParams?.orderBy}
					orderKey="accountGroup3"
					updateOrderByToURL={(newOrder) =>
						urlInfo.updateParams({
							searchParams: { orderBy: newOrder }
						}).url}
				/>
				<TableCustomHeadCell
					title="Title"
					currentOrder={data.searchParams?.orderBy}
					orderKey="title"
					updateOrderByToURL={(newOrder) =>
						urlInfo.updateParams({
							searchParams: { orderBy: newOrder }
						}).url}
				/>
				<TableCustomHeadCell
					title="Type"
					currentOrder={data.searchParams?.orderBy}
					orderKey="type"
					updateOrderByToURL={(newOrder) =>
						urlInfo.updateParams({
							searchParams: { orderBy: newOrder }
						}).url}
				/>
				<TableCustomHeadCell
					title="Status"
					currentOrder={data.searchParams?.orderBy}
					orderKey="status"
					updateOrderByToURL={(newOrder) =>
						urlInfo.updateParams({
							searchParams: { orderBy: newOrder }
						}).url}
				/>
				<TableCustomHeadCell
					title="Is Cash"
					currentOrder={data.searchParams?.orderBy}
					orderKey="isCash"
					updateOrderByToURL={(newOrder) =>
						urlInfo.updateParams({
							searchParams: { orderBy: newOrder }
						}).url}
				/>
				<TableCustomHeadCell
					title="Is Net Worth"
					currentOrder={data.searchParams?.orderBy}
					orderKey="isNetWorth"
					updateOrderByToURL={(newOrder) =>
						urlInfo.updateParams({
							searchParams: { orderBy: newOrder }
						}).url}
				/>
				<TableCustomHeadCell
					title="Start Date"
					currentOrder={data.searchParams?.orderBy}
					orderKey="startDate"
					updateOrderByToURL={(newOrder) =>
						urlInfo.updateParams({
							searchParams: { orderBy: newOrder }
						}).url}
				/>
				<TableCustomHeadCell
					title="End Date"
					currentOrder={data.searchParams?.orderBy}
					orderKey="endDate"
					updateOrderByToURL={(newOrder) =>
						urlInfo.updateParams({
							searchParams: { orderBy: newOrder }
						}).url}
				/>
				<TableHeadCell>Total</TableHeadCell>
				<TableHeadCell>Count</TableHeadCell>
			</TableHead>
			<TableBody>
				{#each data.accounts.data as currentAccount}
					{@const detailURL = urlGenerator({
						address: '/(loggedIn)/accounts/[id]',
						paramsValue: { id: currentAccount.id }
					}).url}

					{@const deleteURL = urlGenerator({
						address: '/(loggedIn)/accounts/[id]/delete',
						paramsValue: { id: currentAccount.id }
					}).url}
					{@const journalsURL = urlGenerator({
						address: '/(loggedIn)/journals',
						searchParamsValue: {
							...defaultJournalFilter(),
							account: {
								id: currentAccount.id,
								type: [...accountTypeEnum]
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
									<RawDataModal data={currentAccount} title="Raw Account Data" dev={data.dev} />
								</ButtonGroup>
							</div>
						</TableBodyCell>
						<TableBodyCell>{currentAccount.accountGroup}</TableBodyCell>
						<TableBodyCell>{currentAccount.accountGroup2}</TableBodyCell>
						<TableBodyCell>{currentAccount.accountGroup3}</TableBodyCell>
						<TableBodyCell>{currentAccount.title}</TableBodyCell>
						<TableBodyCell>{accountTypeToDisplay(currentAccount.type)}</TableBodyCell>
						<TableBodyCell>{statusToDisplay(currentAccount.status)}</TableBodyCell>
						<TableBodyCell>{currentAccount.isCash ? 'Y' : ''}</TableBodyCell>
						<TableBodyCell>{currentAccount.isNetWorth ? 'Y' : ''}</TableBodyCell>
						<TableBodyCell>{currentAccount.startDate || ''}</TableBodyCell>
						<TableBodyCell>{currentAccount.endDate || ''}</TableBodyCell>
						<TableBodyCell>
							<DisplayCurrency
								amount={currentAccount.sum}
								format={data.user?.currencyFormat || 'USD'}
							/>
						</TableBodyCell>
						<TableBodyCell>{currentAccount.count}</TableBodyCell>
					</TableBodyRow>
				{/each}
			</TableBody>
		</Table>
	{/if}
	<center>
		<TablePagination
			count={data.accounts.count}
			page={data.accounts.page}
			perPage={data.accounts.pageSize}
			urlForPage={(value) => urlInfo.updateParams({ searchParams: { page: value } }).url}
			buttonCount={5}
		/>
	</center>
</PageLayout>
