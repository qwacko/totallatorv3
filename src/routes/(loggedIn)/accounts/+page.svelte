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
		Alert,
		Select
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
	import OrderDropDown from '../../../lib/components/OrderDropDown.svelte';
	import { accountOrderByEnum, accountOrderByEnumToText } from '$lib/schema/accountSchema';

	import AccountTypeFilterLinks from '$lib/components/AccountTypeFilterLinks.svelte';
	import RawDataModal from '$lib/components/RawDataModal.svelte';

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

<PageLayout title="Accounts" size="xl">
	<Button
		href={urlGenerator({ address: '/(loggedIn)/accounts/create' }).url}
		class="flex self-center"
	>
		Create
	</Button>
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
			<OrderDropDown
				currentSort={$urlStore.searchParams.orderBy}
				options={[...accountOrderByEnum]}
				onSortURL={(newSort) => urlInfo.updateParams({ searchParams: { orderBy: newSort } }).url}
				optionToTitle={accountOrderByEnumToText}
			/>
		{/if}
	</div>

	{#if data.accounts.count === 0}
		<Alert color="dark">No Matching Accoounts Found</Alert>
	{:else}
		<Table>
			<TableHead>
				<TableHeadCell></TableHeadCell>
				<TableHeadCell>
					<div class="flex flex-row gap-2 items-center">
						<div class="flex">Account Group</div>
						<div class="flex">
							<Button
								href={urlInfo.updateParams({
									searchParams: {
										orderBy: modifyOrderBy(data.searchParams?.orderBy, 'accountGroup')
									}
								}).url}
								class="p-1 border-0"
								outline
							>
								<SortIcon direction={getOrderBy(data.searchParams?.orderBy, 'accountGroup')} />
							</Button>
						</div>
					</div>
				</TableHeadCell>
				<TableHeadCell>
					<div class="flex flex-row gap-2 items-center">
						<div class="flex">Account Group 2</div>
						<div class="flex">
							<Button
								href={urlInfo.updateParams({
									searchParams: {
										orderBy: modifyOrderBy(data.searchParams?.orderBy, 'accountGroup2')
									}
								}).url}
								class="p-1 border-0"
								outline
							>
								<SortIcon direction={getOrderBy(data.searchParams?.orderBy, 'accountGroup2')} />
							</Button>
						</div>
					</div>
				</TableHeadCell>
				<TableHeadCell>
					<div class="flex flex-row gap-2 items-center">
						<div class="flex">Account Group 3</div>
						<div class="flex">
							<Button
								href={urlInfo.updateParams({
									searchParams: {
										orderBy: modifyOrderBy(data.searchParams?.orderBy, 'accountGroup3')
									}
								}).url}
								class="p-1 border-0"
								outline
							>
								<SortIcon direction={getOrderBy(data.searchParams?.orderBy, 'accountGroup3')} />
							</Button>
						</div>
					</div>
				</TableHeadCell>
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
					<TableBodyRow>
						<TableBodyCell>
							<ButtonGroup class="w-full justify-center">
								<Button href={detailURL} class="p-2" outline>
									<EditIcon height={15} width={15} />
								</Button>
								<Button href={deleteURL} class="p-2" outline color="red">
									<DeleteIcon height={15} width={15} />
								</Button>
								<RawDataModal data={currentAccount} title="Raw Account Data" dev={data.dev} />
							</ButtonGroup>
						</TableBodyCell>
						<TableBodyCell>{currentAccount.accountGroup}</TableBodyCell>
						<TableBodyCell>{currentAccount.accountGroup2}</TableBodyCell>
						<TableBodyCell>{currentAccount.accountGroup3}</TableBodyCell>
						<TableBodyCell>{currentAccount.title}</TableBodyCell>
						<TableBodyCell>{statusToDisplay(currentAccount.status)}</TableBodyCell>
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
