<script lang="ts">
	import { Button, ButtonGroup, Badge } from 'flowbite-svelte';
	import PageLayout from '$lib/components/PageLayout.svelte';
	import { statusToDisplay } from '$lib/schema/statusSchema';
	import EditIcon from '$lib/components/icons/EditIcon.svelte';
	import DeleteIcon from '$lib/components/icons/DeleteIcon.svelte';
	import { page } from '$app/stores';
	import { pageInfo, urlGenerator } from '$lib/routes.js';
	import { goto, onNavigate } from '$app/navigation';
	import { browser } from '$app/environment';
	import RawDataModal from '$lib/components/RawDataModal.svelte';
	import CustomHeader from '$lib/components/CustomHeader.svelte';
	import CustomTable from '$lib/components/table/CustomTable.svelte';
	import { enhance } from '$app/forms';
	import DisabledIcon from '$lib/components/icons/DisabledIcon.svelte';
	import EyeIcon from '$lib/components/icons/EyeIcon.svelte';
	import { llmProviderColumnsStore } from '$lib/stores/columnDisplayStores.js';

	const { data } = $props();
	const urlInfo = $derived(pageInfo('/(loggedIn)/settings/providers', $page));

	let filterOpened = $state(false);

	onNavigate(() => {
		filterOpened = false;
	});

	const formatTimestamp = (timestamp: string) => {
		return new Date(timestamp).toLocaleDateString();
	};

	const getStatusColor = (enabled: boolean) => {
		return enabled ? 'green' : 'red';
	};

	const getStatusText = (enabled: boolean) => {
		return enabled ? 'Enabled' : 'Disabled';
	};
</script>

<CustomHeader pageTitle="LLM Providers" />

<PageLayout title="LLM Providers" size="xl">
	{#snippet slotRight()}
		<Button href={urlGenerator({ address: '/(loggedIn)/settings/providers/create' }).url} color="light" outline>
			Create
		</Button>
	{/snippet}

	<CustomTable
		filterText=""
		onSortURL={() => ''}
		paginationInfo={{
			page: 0,
			count: data.providers.length,
			perPage: data.providers.length,
			buttonCount: 1,
			urlForPage: () => ''
		}}
		noneFoundText="No LLM Providers Found"
		data={data.providers}
		currentOrder={undefined}
		currentFilter={{}}
		filterModalTitle="Filter LLM Providers"
		bind:filterOpened
		bind:shownColumns={$llmProviderColumnsStore}
		columns={[
			{ id: 'actions', title: '' },
			{
				id: 'title',
				title: 'Title',
				rowToDisplay: (row) => row.title,
				sortKey: 'title'
			},
			{
				id: 'apiUrl',
				title: 'API URL',
				rowToDisplay: (row) => row.apiUrl
			},
			{
				id: 'defaultModel',
				title: 'Default Model',
				rowToDisplay: (row) => row.defaultModel || 'Not set'
			},
			{
				id: 'status',
				title: 'Status',
				rowToDisplay: (row) => getStatusText(row.enabled),
				sortKey: 'enabled',
				showTitleOnMobile: true
			},
			{
				id: 'createdAt',
				title: 'Created',
				rowToDisplay: (row) => formatTimestamp(row.createdAt),
				sortKey: 'createdAt'
			}
		]}
	>
		{#snippet slotCustomBodyCell({ row: currentRow, currentColumn })}
			{#if currentColumn.id === 'actions'}
				{@const detailURL = urlGenerator({
					address: '/(loggedIn)/settings/providers/[id]',
					paramsValue: { id: currentRow.id }
				}).url}

				{@const deleteURL = urlGenerator({
					address: '/(loggedIn)/settings/providers/[id]/delete',
					paramsValue: { id: currentRow.id }
				}).url}

				{@const logsURL = urlGenerator({
					address: '/(loggedIn)/settings/providers/logs',
					searchParamsValue: { llmSettingsId: currentRow.id }
				}).url}

				<div class="flex flex-row justify-center">
					<form method="POST" action="?/update" use:enhance>
						<input type="hidden" name="id" value={currentRow.id} />
						<ButtonGroup>
							<Button href={logsURL} class="p-2" outline color="blue">
								<EyeIcon height={15} width={15} />
							</Button>
							<Button href={detailURL} class="p-2" outline>
								<EditIcon height={15} width={15} />
							</Button>
							{#if currentRow.enabled}
								<Button type="submit" name="status" value="disabled" class="p-2" outline>
									<DisabledIcon />
								</Button>
							{:else}
								<Button type="submit" name="status" value="active" class="p-2" color="primary">
									<DisabledIcon />
								</Button>
							{/if}
							<Button
								href={deleteURL}
								class="p-2"
								outline
								color="red"
							>
								<DeleteIcon height={15} width={15} />
							</Button>
							<RawDataModal data={currentRow} title="Raw LLM Provider Data" dev={data.dev} />
						</ButtonGroup>
					</form>
				</div>
			{:else if currentColumn.id === 'status'}
				<Badge color={getStatusColor(currentRow.enabled)}>
					{getStatusText(currentRow.enabled)}
				</Badge>
			{/if}
		{/snippet}

		{#snippet slotFilterButtons()}
			<Button 
				href={urlGenerator({ address: '/(loggedIn)/settings/providers/logs' }).url}
				color="light" 
				outline
			>
				View All Logs
			</Button>
		{/snippet}
	</CustomTable>

	{#if data.providers.length === 0}
		<div class="text-center py-8 space-y-4">
			<p class="text-gray-500">No LLM providers configured</p>
			<Button 
				href={urlGenerator({ address: '/(loggedIn)/settings/providers/create' }).url}
				color="primary"
			>
				Add Your First LLM Provider
			</Button>
		</div>
	{/if}
</PageLayout>