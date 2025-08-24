<script lang="ts">
	import { Button, ButtonGroup, DropdownItem, Input } from 'flowbite-svelte';

	import { enhance } from '$app/forms';
	import { onNavigate } from '$app/navigation';
	import { page } from '$app/state';

	import CustomHeader from '$lib/components/CustomHeader.svelte';
	import CloneIcon from '$lib/components/icons/CloneIcon.svelte';
	import DeleteIcon from '$lib/components/icons/DeleteIcon.svelte';
	import EditIcon from '$lib/components/icons/EditIcon.svelte';
	import ObjectTable from '$lib/components/ObjectTable.svelte';
	import PageLayout from '$lib/components/PageLayout.svelte';
	import RawDataModal from '$lib/components/RawDataModal.svelte';
	import CustomTable from '$lib/components/table/CustomTable.svelte';
	import { pageInfo, urlGenerator } from '$lib/routes';
	import { importMappingColumnStore } from '$lib/stores/columnDisplayStores';

	const { data } = $props();

	const urlInfo = pageInfo('/(loggedIn)/importMapping', () => page);

	let filterOpened = $state(false);

	onNavigate(() => {
		filterOpened = false;
	});
</script>

<CustomHeader
	pageTitle="Import Mapping"
	filterText={data.filterText}
	pageNumber={data.importMappings.page}
	numPages={data.importMappings.pageCount}
/>

<PageLayout title="Import Mapping" size="lg">
	{#snippet slotRight()}
		<Button
			href={urlGenerator({ address: '/(loggedIn)/importMapping/create' }).url}
			color="light"
			outline
		>
			Create
		</Button>
	{/snippet}

	{#if urlInfo.current.searchParams && data.searchParams}
		<CustomTable
			highlightText={urlInfo.current.searchParams?.combinedText}
			highlightTextColumns={['title', 'configuration']}
			filterText={data.filterText}
			onSortURL={(newSort) =>
				urlInfo.updateParamsURLGenerator({ searchParams: { orderBy: newSort } }).url}
			paginationInfo={{
				page: data.importMappings.page,
				count: data.importMappings.count,
				perPage: data.importMappings.pageSize,
				buttonCount: 5,
				urlForPage: (value) =>
					urlInfo.updateParamsURLGenerator({ searchParams: { page: value } }).url
			}}
			noneFoundText="No Matching Filters Found"
			data={data.importMappings.data}
			currentOrder={data.searchParams?.orderBy}
			currentFilter={data.searchParams}
			filterModalTitle="Filter Reusable Filters"
			bind:numberRows={urlInfo.current.searchParams.pageSize}
			bind:shownColumns={$importMappingColumnStore}
			bind:filterOpened
			columns={[
				{ id: 'actions', title: 'Actions' },
				{
					id: 'title',
					title: 'Title',
					rowToDisplay: (row) => row.title,
					sortKey: 'title',
					filterActive: Boolean(
						data.searchParams.title !== undefined && data.searchParams.title !== ''
					)
				},
				{
					id: 'configuration',
					title: 'Configuration',
					customCell: true,
					sortKey: 'configuration',
					filterActive: Boolean(data.searchParams.configuration !== undefined),
					showTitleOnMobile: true
				}
			]}
		>
			{#snippet slotCustomBodyCell({ currentColumn, row })}
				{#if currentColumn.id === 'actions'}
					<form use:enhance method="post">
						<input type="hidden" name="importMappingId" value={row.id} />
						<ButtonGroup>
							<Button
								href={urlGenerator({
									address: '/(loggedIn)/importMapping/[id]',
									paramsValue: { id: row.id }
								}).url}
								class="p-2"
								outline
							>
								<EditIcon />
							</Button>
							<Button
								href={urlGenerator({
									address: '/(loggedIn)/importMapping/[id]/delete',
									paramsValue: { id: row.id }
								}).url}
								class="p-2"
								outline
								color="red"
							>
								<DeleteIcon />
							</Button>

							<Button type="submit" class="p-2" outline name="action" value="clone" color="blue">
								<CloneIcon />
							</Button>
							<RawDataModal data={row} title="Reusable Filter Data" dev={data.dev} />
						</ButtonGroup>
					</form>
				{:else if currentColumn.id === 'configuration'}
					{#if row.configuration}
						<ObjectTable
							data={row.configuration}
							highlightText={urlInfo.current.searchParams?.combinedText}
						/>
					{/if}
				{/if}
			{/snippet}
			{#snippet slotFilter()}
				<div class="flex flex-row gap-2">
					{#if urlInfo.current.searchParams}
						<Input
							type="text"
							bind:value={urlInfo.current.searchParams.combinedText}
							placeholder="Filter by Title / Configuration"
							class="flex grow"
						/>
					{/if}
				</div>
			{/snippet}
			{#snippet slotHeaderItem({ currentColumn })}
				{#if urlInfo.current.searchParams}
					{#if currentColumn.id === 'title'}
						<DropdownItem>
							<Input
								type="text"
								bind:value={urlInfo.current.searchParams.title}
								placeholder="Title Filter"
							/>
						</DropdownItem>
					{:else if currentColumn.id === 'configuration'}
						<DropdownItem>
							<Input
								type="text"
								bind:value={urlInfo.current.searchParams.configuration}
								placeholder="Configuration Filter"
							/>
						</DropdownItem>
					{/if}
				{/if}
			{/snippet}
		</CustomTable>
	{/if}
</PageLayout>
