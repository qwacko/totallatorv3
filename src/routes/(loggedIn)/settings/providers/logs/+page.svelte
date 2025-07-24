<script lang="ts">
	import { Button, Badge, Card, Modal, Select, Input, Label } from 'flowbite-svelte';
	import PageLayout from '$lib/components/PageLayout.svelte';
	import CustomHeader from '$lib/components/CustomHeader.svelte';
	import CustomTable from '$lib/components/table/CustomTable.svelte';
	import { page } from '$app/stores';
	import { pageInfo, pageInfoStore } from '$lib/routes';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import EyeIcon from '$lib/components/icons/EyeIcon.svelte';
	import { llmLogColumnsStore } from '$lib/stores/columnDisplayStores.js';

	const { data } = $props();
	const urlInfo = $derived(pageInfo('/(loggedIn)/settings/providers/logs', $page));

	const urlStore = pageInfoStore({
		routeId: '/(loggedIn)/settings/providers/logs',
		pageInfo: page,
		onUpdate: (newURL) => {
			if (browser && newURL !== urlInfo.current.url) {
				goto(newURL, { keepFocus: true, noScroll: true });
			}
		},
		updateDelay: 500
	});

	let selectedLog: any = $state(null);
	let showLogModal = $state(false);
	let filterOpened = $state(false);

	// Status options for filter
	const statusOptions = [
		{ value: '', name: 'All Statuses' },
		{ value: 'SUCCESS', name: 'Success' },
		{ value: 'ERROR', name: 'Error' }
	];

	// LLM Settings options for filter
	const llmSettingsOptions = [
		{ value: '', name: 'All Settings' },
		...data.llmSettings.map(setting => ({ 
			value: setting.id, 
			name: setting.title 
		}))
	];

	const formatDuration = (ms: number) => {
		if (ms < 1000) return `${ms}ms`;
		return `${(ms / 1000).toFixed(2)}s`;
	};

	const formatTimestamp = (timestamp: string) => {
		return new Date(timestamp).toLocaleString();
	};

	const getStatusColor = (status: string) => {
		return status === 'SUCCESS' ? 'green' : 'red';
	};

	const openLogModal = (log: any) => {
		selectedLog = log;
		showLogModal = true;
	};

	const closeLogModal = () => {
		selectedLog = null;
		showLogModal = false;
	};

	const formatJSON = (obj: any) => {
		try {
			return JSON.stringify(obj, null, 2);
		} catch {
			return String(obj);
		}
	};
</script>

<CustomHeader 
	pageTitle="LLM Logs" 
	pageNumber={data.pagination.page}
	numPages={data.pagination.pageCount}
/>

<PageLayout title="LLM Logs" size="xl">
	{#snippet slotRight()}
		<Button href="/settings/llm" color="light" outline>
			Back to Settings
		</Button>
	{/snippet}

	{#if $urlStore.searchParams && data.searchParams}
		<CustomTable
			filterText=""
			onSortURL={(newSort) => urlInfo.updateParams({ searchParams: { orderBy: newSort } }).url}
			paginationInfo={{
				page: data.pagination.page,
				count: data.pagination.totalCount,
				perPage: data.pagination.pageSize,
				buttonCount: 5,
				urlForPage: (value) => urlInfo.updateParams({ searchParams: { page: value } }).url
			}}
			noneFoundText="No LLM Logs Found"
			data={data.logs}
			currentOrder={data.searchParams?.orderBy}
			currentFilter={data.searchParams}
			filterModalTitle="Filter LLM Logs"
			bind:numberRows={$urlStore.searchParams.pageSize}
			bind:filterOpened
			bind:shownColumns={$llmLogColumnsStore}
			columns={[
				{ id: 'actions', title: '' },
				{
					id: 'timestamp',
					title: 'Timestamp',
					rowToDisplay: (row) => formatTimestamp(row.timestamp),
					sortKey: 'timestamp'
				},
				{
					id: 'status',
					title: 'Status',
					rowToDisplay: (row) => row.status,
					sortKey: 'status',
					showTitleOnMobile: true
				},
				{
					id: 'llmSettings',
					title: 'LLM Setting',
					rowToDisplay: (row) => row.llmSettingsTitle || 'Unknown'
				},
				{
					id: 'duration',
					title: 'Duration',
					rowToDisplay: (row) => formatDuration(row.durationMs),
					sortKey: 'durationMs'
				},
				{
					id: 'relatedJournal',
					title: 'Related Journal',
					rowToDisplay: (row) => row.relatedJournalId || '-'
				}
			]}
		>
			{#snippet slotCustomBodyCell({ row: currentRow, currentColumn })}
				{#if currentColumn.id === 'actions'}
					<div class="flex flex-row justify-center">
						<Button 
							class="p-2" 
							outline 
							color="blue"
							onclick={() => openLogModal(currentRow)}
						>
							<EyeIcon height={15} width={15} />
						</Button>
					</div>
				{:else if currentColumn.id === 'status'}
					<Badge color={getStatusColor(currentRow.status)}>
						{currentRow.status}
					</Badge>
				{/if}
			{/snippet}

			{#snippet slotFilter()}
				<div class="flex flex-row gap-2">
					{#if $urlStore.searchParams}
						<Select
							items={statusOptions}
							bind:value={$urlStore.searchParams.status}
							placeholder="Filter by status"
							class="w-48"
						/>
						<Select
							items={llmSettingsOptions}
							bind:value={$urlStore.searchParams.llmSettingsId}
							placeholder="Filter by LLM setting"
							class="w-48"
						/>
						<Input
							type="date"
							bind:value={$urlStore.searchParams.dateFrom}
							placeholder="From date"
							class="w-48"
						/>
						<Input
							type="date"
							bind:value={$urlStore.searchParams.dateTo}
							placeholder="To date"
							class="w-48"
						/>
					{/if}
				</div>
			{/snippet}
		</CustomTable>
	{/if}
</PageLayout>

<!-- Log Detail Modal -->
{#if showLogModal && selectedLog}
	<Modal bind:open={showLogModal} size="xl" class="w-full">
		<h3 slot="header" class="text-xl font-semibold">
			LLM Log Details - {formatTimestamp(selectedLog.timestamp)}
		</h3>

		<div class="space-y-4">
			<!-- Overview -->
			<Card>
				<h4 class="font-semibold mb-3">Overview</h4>
				<div class="grid grid-cols-2 gap-4 text-sm">
					<div>
						<span class="font-medium">Status:</span>
						<Badge color={getStatusColor(selectedLog.status)} class="ml-2">
							{selectedLog.status}
						</Badge>
					</div>
					<div>
						<span class="font-medium">Duration:</span>
						{formatDuration(selectedLog.durationMs)}
					</div>
					<div>
						<span class="font-medium">LLM Setting:</span>
						{selectedLog.llmSettingsTitle || 'Unknown'}
					</div>
					<div>
						<span class="font-medium">API URL:</span>
						{selectedLog.llmSettingsApiUrl || 'Unknown'}
					</div>
					{#if selectedLog.relatedJournalId}
						<div class="col-span-2">
							<span class="font-medium">Related Journal:</span>
							<Button 
								href="/journals?id={selectedLog.relatedJournalId}"
								size="xs"
								color="blue"
								class="ml-2"
							>
								View Journal Entry
							</Button>
						</div>
					{/if}
				</div>
			</Card>

			<!-- Request Payload -->
			<Card>
				<h4 class="font-semibold mb-3">Request Payload</h4>
				<pre class="bg-gray-100 p-3 rounded text-sm overflow-auto max-h-64 whitespace-pre-wrap">{formatJSON(selectedLog.requestPayload)}</pre>
			</Card>

			<!-- Response Payload -->
			<Card>
				<h4 class="font-semibold mb-3">Response Payload</h4>
				<pre class="bg-gray-100 p-3 rounded text-sm overflow-auto max-h-64 whitespace-pre-wrap">{formatJSON(selectedLog.responsePayload)}</pre>
			</Card>
		</div>

		<Button slot="footer" color="light" onclick={closeLogModal}>Close</Button>
	</Modal>
{/if}