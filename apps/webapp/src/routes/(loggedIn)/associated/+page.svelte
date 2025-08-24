<script lang="ts">
	import { Button } from 'flowbite-svelte';

	import { onNavigate } from '$app/navigation';
	import { page } from '$app/state';

	import CustomHeader from '$lib/components/CustomHeader.svelte';
	import PageLayout from '$lib/components/PageLayout.svelte';
	import RawDataModal from '$lib/components/RawDataModal.svelte';
	import CustomTable from '$lib/components/table/CustomTable.svelte';
	import { pageInfo, urlGenerator } from '$lib/routes.js';
	import { associatedInfoColumnsStore } from '$lib/stores/columnDisplayStores.js';

	import DisplayAssociatedLinks from './DisplayAssociatedLinks.svelte';

	const { data } = $props();
	const urlInfo = pageInfo('/(loggedIn)/associated', () => page);

	let filterOpened = $state(false);

	onNavigate(() => {
		filterOpened = false;
	});
</script>

<CustomHeader
	pageTitle="Associated Info"
	filterText={data.filterText}
	pageNumber={data.data.page}
	numPages={data.data.pageCount}
/>

<PageLayout title="Associated Info" size="xl">
	{#snippet slotRight()}
		<Button href={urlGenerator({ address: '/(loggedIn)/bills/create' }).url} color="light" outline>
			Create
		</Button>
	{/snippet}
	{#if urlInfo.current.searchParams && data.searchParams}
		<CustomTable
			filterText={data.filterText}
			onSortURL={(newSort) =>
				urlInfo.updateParamsURLGenerator({ searchParams: { orderBy: newSort } }).url}
			paginationInfo={{
				page: data.data.page,
				count: data.data.count,
				perPage: data.data.pageSize,
				buttonCount: 5,
				urlForPage: (value) =>
					urlInfo.updateParamsURLGenerator({ searchParams: { page: value } }).url
			}}
			noneFoundText="No Matching Assocaited Info Found"
			data={data.data.data}
			currentOrder={data.searchParams?.orderBy}
			currentFilter={data.searchParams}
			filterModalTitle="Filter Associated Info"
			bind:numberRows={urlInfo.current.searchParams.pageSize}
			bind:filterOpened
			columns={[
				{ id: 'actions', title: '' },
				{
					id: 'createdAt',
					title: 'Created',
					rowToDisplay: (row) => row.createdAt.toISOString().slice(0, 10),
					sortKey: 'createdAt',
					showTitleOnMobile: true
				},
				{
					id: 'title',
					title: 'Title',
					rowToDisplay: (row) => row.title || '',
					sortKey: 'title'
				},
				{
					id: 'links',
					title: 'Links'
				}
			]}
			bind:shownColumns={$associatedInfoColumnsStore}
		>
			{#snippet slotCustomBodyCell({ row: currentRow, currentColumn })}
				{#if currentColumn.id === 'actions'}
					<RawDataModal data={currentRow} title="Raw Associated Info Data" dev={data.dev} />
				{:else if currentColumn.id === 'links'}
					<DisplayAssociatedLinks data={currentRow} />
				{/if}
			{/snippet}
		</CustomTable>
	{/if}
</PageLayout>
