<script lang="ts">
	import { Badge, Button, Input, Select } from 'flowbite-svelte';

	import { page } from '$app/state';

	import CustomHeader from '$lib/components/CustomHeader.svelte';
	import EyeIcon from '$lib/components/icons/EyeIcon.svelte';
	import PageLayout from '$lib/components/PageLayout.svelte';
	import CustomTable from '$lib/components/table/CustomTable.svelte';
	import { pageInfo } from '$lib/routes';
	import { llmLogColumnsStore } from '$lib/stores/columnDisplayStores.js';

	const { data } = $props();
	const urlInfo = pageInfo('/(loggedIn)/llm/logs', () => page);

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
		...data.llmSettings.map((setting) => ({
			value: setting.id,
			name: setting.title
		}))
	];

	const formatDuration = (ms: number) => {
		if (ms < 1000) return `${ms}ms`;
		return `${(ms / 1000).toFixed(2)}s`;
	};

	const formatTimestamp = (timestamp: string | Date) => {
		return new Date(timestamp).toLocaleString();
	};

	const getStatusColor = (status: string) => {
		return status === 'SUCCESS' ? 'green' : 'red';
	};
</script>

<CustomHeader
	pageTitle="LLM Logs"
	pageNumber={data.pagination.page}
	numPages={data.pagination.pageCount}
/>

<PageLayout title="LLM Logs" size="lg">
	{#snippet slotRight()}
		<Button href="/settings/llm" color="light" outline>Back to Settings</Button>
	{/snippet}

	{#if urlInfo.current.searchParams && data.searchParams}
		<CustomTable
			filterText={[]}
			onSortURL={(newSort) =>
				urlInfo.updateParamsURLGenerator({
					searchParams: { orderBy: JSON.stringify(newSort) }
				}).url}
			paginationInfo={{
				page: data.pagination.page,
				count: data.pagination.totalCount,
				perPage: data.pagination.pageSize,
				buttonCount: 5,
				urlForPage: (value) =>
					urlInfo.updateParamsURLGenerator({ searchParams: { page: value } }).url
			}}
			noneFoundText="No LLM Logs Found"
			data={data.logs}
			currentOrder={data.searchParams?.orderBy ? JSON.parse(data.searchParams.orderBy) : undefined}
			currentFilter={data.searchParams}
			filterModalTitle="Filter LLM Logs"
			bind:numberRows={urlInfo.current.searchParams.pageSize}
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
						<Button class="p-2" outline color="blue" href="/llm/logs/{currentRow.id}">
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
					{#if urlInfo.current.searchParams}
						<Select
							items={statusOptions}
							bind:value={urlInfo.current.searchParams.status}
							placeholder="Filter by status"
							class="w-48"
						/>
						<Select
							items={llmSettingsOptions}
							bind:value={urlInfo.current.searchParams.llmSettingsId}
							placeholder="Filter by LLM setting"
							class="w-48"
						/>
						<Input
							type="date"
							bind:value={urlInfo.current.searchParams.dateFrom}
							placeholder="From date"
							class="w-48"
						/>
						<Input
							type="date"
							bind:value={urlInfo.current.searchParams.dateTo}
							placeholder="To date"
							class="w-48"
						/>
					{/if}
				</div>
			{/snippet}
		</CustomTable>
	{/if}
</PageLayout>
