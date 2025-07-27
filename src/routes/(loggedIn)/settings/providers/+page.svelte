<script lang="ts">
	import { Button, ButtonGroup, Badge } from 'flowbite-svelte';
	import PageLayout from '$lib/components/PageLayout.svelte';
	import EditIcon from '$lib/components/icons/EditIcon.svelte';
	import DeleteIcon from '$lib/components/icons/DeleteIcon.svelte';
	import { page } from '$app/stores';
	import { urlGenerator } from '$lib/routes.js';
	import { goto, onNavigate } from '$app/navigation';
	import { browser } from '$app/environment';
	import RawDataModal from '$lib/components/RawDataModal.svelte';
	import CustomHeader from '$lib/components/CustomHeader.svelte';
	import CustomTable from '$lib/components/table/CustomTable.svelte';
	import { enhance } from '$app/forms';
	import DisabledIcon from '$lib/components/icons/DisabledIcon.svelte';
	import EyeIcon from '$lib/components/icons/EyeIcon.svelte';
	import { llmProviderColumnsStore } from '$lib/stores/columnDisplayStores.js';
	import { notificationStore } from '$lib/stores/notificationStore.js';

	const { data } = $props();

	let filterOpened = $state(false);
	let processingJournals = $state(false);

	// Check for success message from URL params
	$effect(() => {
		if ($page.url.searchParams.get('processed') === 'true') {
			notificationStore.send({
				title: 'LLM Processing Complete',
				type: 'success',
				message: 'Journals have been processed successfully',
				duration: 2000
			});

			// Clean up URL
			if (browser) {
				const url = new URL($page.url);
				url.searchParams.delete('processed');
				goto(url.toString(), { replaceState: true });
			}
		}
	});

	onNavigate(() => {
		filterOpened = false;
	});

	const formatTimestamp = (timestamp: string | Date) => {
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
		<ButtonGroup>
			<form
				method="POST"
				action="?/processJournals"
				use:enhance={() => {
					processingJournals = true;

					return ({ update }) => {
						processingJournals = false;
						update();
					};
				}}
			>
				<Button
					type="submit"
					color="primary"
					disabled={processingJournals || data.providers.filter((p) => p.enabled).length === 0}
				>
					{processingJournals ? 'Processing...' : 'Process Journals'}
				</Button>
			</form>
			<Button
				href={urlGenerator({ address: '/(loggedIn)/settings/providers/create' }).url}
				color="light"
				outline
			>
				Create
			</Button>
		</ButtonGroup>
	{/snippet}

	<CustomTable
		filterText={[]}
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
					searchParamsValue: { page: 0, pageSize: 20, llmSettingsId: currentRow.id }
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
							<Button href={deleteURL} class="p-2" outline color="red">
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
				href={urlGenerator({
					address: '/(loggedIn)/settings/providers/logs',
					searchParamsValue: { page: 0, pageSize: 10 }
				}).url}
				color="light"
				outline
			>
				View All Logs
			</Button>
		{/snippet}
	</CustomTable>

	{#if data.providers.length === 0}
		<div class="space-y-4 py-8 text-center">
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
