<script lang="ts">
	import PageLayout from '$lib/components/PageLayout.svelte';
	import RawDataModal from '$lib/components/RawDataModal.svelte';
	import { pageInfo, pageInfoStore, urlGenerator } from '$lib/routes';
	import { page } from '$app/stores';
	import { browser } from '$app/environment';
	import CustomHeader from '$lib/components/CustomHeader.svelte';
	import { goto, onNavigate } from '$app/navigation';
	import { Button, ButtonGroup, DropdownItem, Input } from 'flowbite-svelte';
	import CustomTable from '$lib/components/table/CustomTable.svelte';
	import { importMappingColumnStore } from '$lib/stores/columnDisplayStores';
	import EditIcon from '$lib/components/icons/EditIcon.svelte';
	import DeleteIcon from '$lib/components/icons/DeleteIcon.svelte';
	import ObjectTable from '$lib/components/ObjectTable.svelte';
	import { enhance } from '$app/forms';
	import CloneIcon from '$lib/components/icons/CloneIcon.svelte';

	const {data} = $props()

	const urlInfo = $derived(pageInfo('/(loggedIn)/importMapping', $page));

	const urlStore = pageInfoStore({
		routeId: '/(loggedIn)/importMapping',
		pageInfo: page,
		onUpdate: (newURL) => {
			if (browser && newURL !== urlInfo.current.url) {
				goto(newURL, { keepFocus: true, noScroll: true });
			}
		},
		updateDelay: 500
	});

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
	<svelte:fragment slot="right">
		<Button
			href={urlGenerator({ address: '/(loggedIn)/importMapping/create' }).url}
			color="light"
			outline
		>
			Create
		</Button>
	</svelte:fragment>

	{#if $urlStore.searchParams && data.searchParams}
		<CustomTable
			highlightText={$urlStore.searchParams?.combinedText}
			highlightTextColumns={['title', 'configuration']}
			filterText={data.filterText}
			onSortURL={(newSort) => urlInfo.updateParams({ searchParams: { orderBy: newSort } }).url}
			paginationInfo={{
				page: data.importMappings.page,
				count: data.importMappings.count,
				perPage: data.importMappings.pageSize,
				buttonCount: 5,
				urlForPage: (value) => urlInfo.updateParams({ searchParams: { page: value } }).url
			}}
			noneFoundText="No Matching Filters Found"
			data={data.importMappings.data}
			currentOrder={data.searchParams?.orderBy}
			currentFilter={data.searchParams}
			filterModalTitle="Filter Reusable Filters"
			bind:numberRows={$urlStore.searchParams.pageSize}
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
			<svelte:fragment slot="customBodyCell" let:currentColumn let:row>
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
							highlightText={$urlStore.searchParams?.combinedText}
						/>
					{/if}
				{/if}
			</svelte:fragment>
			<svelte:fragment slot="filter">
				<div class="flex flex-row gap-2">
					{#if $urlStore.searchParams}
						<Input
							type="text"
							bind:value={$urlStore.searchParams.combinedText}
							placeholder="Filter by Title / Configuration"
							class="flex flex-grow"
						/>
					{/if}
				</div>
			</svelte:fragment>

			<svelte:fragment slot="headerItem" let:currentColumn>
				{#if currentColumn.id === 'title'}
					<DropdownItem>
						<Input
							type="text"
							bind:value={$urlStore.searchParams.title}
							placeholder="Title Filter"
						/>
					</DropdownItem>
				{:else if currentColumn.id === 'configuration'}
					<DropdownItem>
						<Input
							type="text"
							bind:value={$urlStore.searchParams.configuration}
							placeholder="Configuration Filter"
						/>
					</DropdownItem>
				{/if}
			</svelte:fragment>
			<!-- <svelte:fragment slot="filterModal">
				<ReusableFilterFilter bind:filter={$urlStore.searchParams} />
			</svelte:fragment> -->
		</CustomTable>
	{/if}
</PageLayout>
