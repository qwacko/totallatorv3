<script lang="ts">
	import {
		Button,
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
	import { pageInfo, urlGenerator } from '$lib/routes.js';
	import { getOrderBy, modifyOrderBy } from './orderByHelper.js';
	import SortIcon from '$lib/components/SortIcon.svelte';
	import TablePagination from '$lib/components/TablePagination.svelte';

	export let data;
	$: urlInfo = pageInfo('/(loggedIn)/tags', $page);
</script>

<PageLayout title="Tags" size="lg">
	<Button href="/tags/create">Create</Button>
	<TablePagination
		count={data.tags.count}
		page={data.tags.page}
		perPage={data.tags.pageSize}
		urlForPage={(value) => urlInfo.updateParams({ searchParams: { page: value } }).url}
		buttonCount={5}
	/>
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
						<center>
							<Button href={detailURL} class="p-2" outline>
								<EditIcon height={15} width={15} />
							</Button>
							<Button href={deleteURL} class="p-2" outline color="red">
								<DeleteIcon height={15} width={15} />
							</Button>
						</center>
					</TableBodyCell>
					<TableBodyCell>{currentTag.group}</TableBodyCell>
					<TableBodyCell>{currentTag.single}</TableBodyCell>
					<TableBodyCell>{statusToDisplay(currentTag.status)}</TableBodyCell>
				</TableBodyRow>
			{/each}
		</TableBody>
	</Table>
</PageLayout>
