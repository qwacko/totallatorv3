<script lang="ts">
	import { Badge, Button, ButtonGroup, Input } from 'flowbite-svelte';

	import { autoImportFrequencyToDisplay, autoImportTypeToDisplay } from '@totallator/shared';

	import { enhance } from '$app/forms';
	import { page } from '$app/state';

	import AssociatedInfoButtonPromise from '$lib/components/AssociatedInfoButtonPromise.svelte';
	import CustomHeader from '$lib/components/CustomHeader.svelte';
	import CloneIcon from '$lib/components/icons/CloneIcon.svelte';
	import DeleteIcon from '$lib/components/icons/DeleteIcon.svelte';
	import EditIcon from '$lib/components/icons/EditIcon.svelte';
	import ImportIcon from '$lib/components/icons/ImportIcon.svelte';
	import PageLayout from '$lib/components/PageLayout.svelte';
	import RawDataModal from '$lib/components/RawDataModal.svelte';
	import CustomTable from '$lib/components/table/CustomTable.svelte';
	import { pageInfo, urlGenerator } from '$lib/routes.js';
	import { autoImportColumnsStore } from '$lib/stores/columnDisplayStores';

	const { data } = $props();

	const urlInfo = pageInfo('/(loggedIn)/autoImport', () => page);
</script>

<CustomHeader pageTitle="Auto Imports" numPages={data.list.pageCount} pageNumber={data.list.page} />

<PageLayout title="Auto Imports" size="xl">
	{#snippet slotRight()}
		<Button
			href={urlGenerator({ address: '/(loggedIn)/autoImport/create' }).url}
			outline
			color="green"
		>
			New
		</Button>
	{/snippet}
	{#if urlInfo.current.searchParams && data.filter}
		<CustomTable
			highlightText={urlInfo.current.searchParams?.title}
			highlightTextColumns={['title']}
			paginationInfo={{
				page: data.list.page,
				count: data.list.count,
				perPage: data.list.pageSize,
				buttonCount: 5,
				urlForPage: (value) =>
					urlInfo.updateParamsURLGenerator({ searchParams: { page: value } }).url
			}}
			bind:numberRows={urlInfo.current.searchParams.pageSize}
			bulkSelection={false}
			data={data.list.data}
			hideBottomPagination={true}
			hideTopPagination={false}
			rowToId={(row) => row.id}
			noneFoundText="No Auto Imports Found"
			columns={[
				{ id: 'actions', title: '' },
				{
					id: 'enabled',
					title: 'Enabled',
					sortKey: 'enabled'
				},
				{
					id: 'title',
					title: 'Title',
					rowToDisplay: (row) => row.title,
					sortKey: 'title'
				},
				{
					id: 'type',
					title: 'Type',
					sortKey: 'type',
					showTitleOnMobile: true
				},
				{
					id: 'autoProcess',
					title: 'Auto Process',
					sortKey: 'autoProcess',
					showTitleOnMobile: true
				},
				{
					id: 'autoClean',
					title: 'Auto Clean',
					sortKey: 'autoClean',
					showTitleOnMobile: true
				},
				{
					id: 'frequency',
					title: 'Frequency',
					sortKey: 'frequency',
					showTitleOnMobile: true
				},
				{
					id: 'importMapping',
					title: 'Mapping',
					rowToDisplay: (row) => row.importMappingTitle,
					sortKey: 'importMapping',
					showTitleOnMobile: true
				},
				{
					id: 'createdAt',
					title: 'Created Date',
					rowToDisplay: (row) => row.createdAt.toISOString().slice(0, 10),
					sortKey: 'createdAt',
					showTitleOnMobile: true
				},
				{
					id: 'updatedAt',
					title: 'Updated Date',
					rowToDisplay: (row) => row.updatedAt.toISOString().slice(0, 10),
					sortKey: 'updatedAt',
					showTitleOnMobile: true
				}
			]}
			bind:shownColumns={$autoImportColumnsStore}
			rowColour={(row) => (row.enabled ? undefined : 'grey')}
			onSortURL={(newSort) =>
				urlInfo.updateParamsURLGenerator({ searchParams: { orderBy: newSort } }).url}
			currentOrder={data.filter.orderBy}
			currentFilter={data.filter}
		>
			{#snippet slotCustomBodyCell({ currentColumn, row: currentRow })}
				{#if currentColumn.id === 'actions'}
					{@const detailURL = urlGenerator({
						address: '/(loggedIn)/autoImport/[id]',
						paramsValue: { id: currentRow.id }
					}).url}
					{@const deleteURL = urlGenerator({
						address: '/(loggedIn)/autoImport/[id]/delete',
						paramsValue: { id: currentRow.id }
					}).url}
					{@const importsURL = urlGenerator({
						address: '/(loggedIn)/import',
						searchParamsValue: {
							autoImportId: currentRow.id,
							pageSize: 10
						}
					}).url}
					<div class="flex flex-row justify-center">
						<form use:enhance action="?/clone" method="post">
							<input type="hidden" name="id" value={currentRow.id} />
							<ButtonGroup>
								<Button href={importsURL} class="p-2" outline color="blue">
									<ImportIcon height={15} width={15} />
								</Button>
								<Button href={detailURL} class="p-2" outline>
									<EditIcon height={15} width={15} />
								</Button>
								<Button href={deleteURL} class="p-2" outline color="red">
									<DeleteIcon height={15} width={15} />
								</Button>
								<Button type="submit" class="p-2" outline color="blue">
									<CloneIcon height={15} width={15} />
								</Button>
								<AssociatedInfoButtonPromise
									data={currentRow.associated}
									target={{ autoImportId: currentRow.id }}
									id={currentRow.id}
								/>
								<RawDataModal
									data={currentRow.config}
									title="{currentRow.title} Config"
									dev={true}
									icon="more"
									outline
								/>
							</ButtonGroup>
						</form>
					</div>
				{:else if currentColumn.id === 'enabled'}
					<Badge color={currentRow.enabled ? 'green' : 'red'}>
						{#if currentRow.enabled}
							Enabled
						{:else}
							Disabled
						{/if}
					</Badge>
				{:else if currentColumn.id === 'type'}
					<Badge>
						{autoImportTypeToDisplay(currentRow.type)}
					</Badge>
				{:else if currentColumn.id === 'frequency'}
					<Badge>
						{autoImportFrequencyToDisplay(currentRow.frequency)}
					</Badge>
				{:else if currentColumn.id === 'autoProcess'}
					{#if currentRow.autoProcess === true}
						<Badge color="green">Auto</Badge>
					{:else}
						<Badge color="yellow">Manual</Badge>
					{/if}
				{:else if currentColumn.id === 'autoClean'}
					{#if currentRow.autoClean === true}
						<Badge color="green">Auto</Badge>
					{:else}
						<Badge color="yellow">Manual</Badge>
					{/if}
				{/if}
			{/snippet}
			{#snippet slotFilter()}
				<div class="flex flex-row gap-2">
					{#if urlInfo.current.searchParams}
						<Input
							type="text"
							bind:value={urlInfo.current.searchParams.title}
							placeholder="Filter by Title"
							class="flex grow"
						/>
					{/if}
				</div>
			{/snippet}
		</CustomTable>
	{/if}
</PageLayout>
