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

	export let data;
	$: urlInfo = pageInfo('/(loggedIn)/tags', $page);

	const urlStore = pageInfoStore({
		routeId: '/(loggedIn)/tags',
		pageInfo: page,
		onUpdate: (newURL) => {
			if (browser && newURL !== urlInfo.current.url) {
				goto(newURL, { keepFocus: true, noScroll: true });
			}
		},
		updateDelay: 500
	});
</script>

<PageLayout title="Tags" size="lg">
	<Button href={urlGenerator({ address: '/(loggedIn)/tags/create' }).url}>Create</Button>
	<center>
		<TablePagination
			count={data.tags.count}
			page={data.tags.page}
			perPage={data.tags.pageSize}
			urlForPage={(value) => urlInfo.updateParams({ searchParams: { page: value } }).url}
			buttonCount={5}
		/>
	</center>
	<div>
		{#if $urlStore.searchParams}
			<Input type="text" bind:value={$urlStore.searchParams.title} />
		{/if}
	</div>

	{#if data.tags.count === 0}
		<Alert color="dark">No Matching Tags Found</Alert>
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
				{#each data.tags.data as currentTag}
					{@const detailURL = urlGenerator({
						address: '/(loggedIn)/tags/[id]',
						paramsValue: { id: currentTag.id }
					}).url}

					{@const deleteURL = urlGenerator({
						address: '/(loggedIn)/tags/[id]/delete',
						paramsValue: { id: currentTag.id }
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
						<TableBodyCell>{currentTag.group}</TableBodyCell>
						<TableBodyCell>{currentTag.single}</TableBodyCell>
						<TableBodyCell>{statusToDisplay(currentTag.status)}</TableBodyCell>
					</TableBodyRow>
				{/each}
			</TableBody>
		</Table>
	{/if}
	<center>
		<TablePagination
			count={data.tags.count}
			page={data.tags.page}
			perPage={data.tags.pageSize}
			urlForPage={(value) => urlInfo.updateParams({ searchParams: { page: value } }).url}
			buttonCount={5}
		/>
	</center>
</PageLayout>