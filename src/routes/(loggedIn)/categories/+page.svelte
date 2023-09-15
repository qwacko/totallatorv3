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

<PageLayout title="Categories" size="lg">
	<Button href={urlGenerator({ address: '/(loggedIn)/categories/create' }).url}>Create</Button>
	<center>
		<TablePagination
			count={data.categories.count}
			page={data.categories.page}
			perPage={data.categories.pageSize}
			urlForPage={(value) => urlInfo.updateParams({ searchParams: { page: value } }).url}
			buttonCount={5}
		/>
	</center>
	<div>
		{#if $urlStore.searchParams}
			<Input type="text" bind:value={$urlStore.searchParams.title} />
		{/if}
	</div>
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
					<TableBodyRow>
						<TableBodyCell>
							<ButtonGroup class="w-full justify-center">
								<Button href={detailURL} class="p-2" outline>
									<EditIcon height={15} width={15} />
								</Button>
								<Button href={deleteURL} class="p-2" outline color="red">
									<DeleteIcon height={15} width={15} />
								</Button>
							</ButtonGroup>
						</TableBodyCell>
						<TableBodyCell>{currentCategory.group}</TableBodyCell>
						<TableBodyCell>{currentCategory.single}</TableBodyCell>
						<TableBodyCell>{statusToDisplay(currentCategory.status)}</TableBodyCell>
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
