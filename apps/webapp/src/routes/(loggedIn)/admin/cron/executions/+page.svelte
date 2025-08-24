<script lang="ts">
	import { Badge, Button, Select } from 'flowbite-svelte';
	import { CheckCircleOutline, ClockOutline, CloseCircleOutline } from 'flowbite-svelte-icons';

	import { onNavigate } from '$app/navigation';
	import { page } from '$app/state';

	import CustomHeader from '$lib/components/CustomHeader.svelte';
	import CronIcon from '$lib/components/icons/CronIcon.svelte';
	import PageLayout from '$lib/components/PageLayout.svelte';
	import CustomTable from '$lib/components/table/CustomTable.svelte';
	import { pageInfo, urlGenerator } from '$lib/routes.js';

	const { data } = $props();

	const urlInfo = pageInfo('/(loggedIn)/admin/cron/executions', () => page);

	// Remove unused urlStore for now

	let filterOpened = $state(false);
	let shownColumns = $state([
		'status',
		'jobName',
		'startedAt',
		'duration',
		'triggeredBy',
		'actions'
	]);

	onNavigate(() => {
		filterOpened = false;
	});

	function formatDuration(ms: number | null): string {
		if (!ms) return 'N/A';
		if (ms < 1000) return `${ms}ms`;
		if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
		return `${(ms / 60000).toFixed(1)}m`;
	}

	function formatDate(date: string | Date | null): string {
		if (!date) return 'Never';
		if (date instanceof Date) {
			return date.toLocaleString();
		}
		return new Date(date).toLocaleString();
	}

	function getStatusBadge(status: string) {
		switch (status) {
			case 'completed':
				return { color: 'green' as const, icon: CheckCircleOutline };
			case 'failed':
				return { color: 'red' as const, icon: CloseCircleOutline };
			case 'timeout':
				return { color: 'yellow' as const, icon: ClockOutline };
			case 'running':
				return { color: 'blue' as const, icon: ClockOutline };
			default:
				return { color: 'gray' as const, icon: ClockOutline };
		}
	}

	const statusOptions = [
		{ value: '', name: 'All Statuses' },
		{ value: 'completed', name: 'Completed' },
		{ value: 'failed', name: 'Failed' },
		{ value: 'timeout', name: 'Timeout' },
		{ value: 'running', name: 'Running' }
	];

	const triggeredByOptions = [
		{ value: '', name: 'All Triggers' },
		{ value: 'system', name: 'System' },
		{ value: 'manual', name: 'Manual' }
	];
</script>

<CustomHeader
	pageTitle="Cron Job Executions"
	filterText={data.filterText}
	pageNumber={data.executions.page}
	numPages={data.executions.pageCount}
/>

<PageLayout title="Cron Job Executions" size="xl">
	{#snippet slotRight()}
		<Button
			href={urlGenerator({
				address: '/(loggedIn)/admin/cron',
				searchParamsValue: {}
			}).url}
			color="light"
			outline
		>
			<CronIcon class="mr-2 h-4 w-4" />
			Back to Jobs
		</Button>
	{/snippet}

	<!-- Statistics Cards -->
	<div class="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
		<div class="rounded-lg border bg-white p-4">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm font-medium text-gray-600">Total Executions</p>
					<p class="text-2xl font-bold">{data.statistics.totalExecutions}</p>
					<p class="text-xs text-gray-500">{data.statistics.period}</p>
				</div>
			</div>
		</div>

		<div class="rounded-lg border bg-white p-4">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm font-medium text-gray-600">Success Rate</p>
					<p class="text-2xl font-bold text-green-600">
						{data.statistics.successRate}%
					</p>
				</div>
			</div>
		</div>

		<div class="rounded-lg border bg-white p-4">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm font-medium text-gray-600">Showing Results</p>
					<p class="text-2xl font-bold">{data.executions.count}</p>
				</div>
			</div>
		</div>
	</div>

	{#if urlInfo.current.searchParams && data.searchParams}
		<!-- Main Table -->
		<CustomTable
			filterText={data.filterText}
			onSortURL={(newSort) =>
				urlInfo.updateParamsURLGenerator({ searchParams: { orderBy: newSort } }).url}
			paginationInfo={{
				page: data.executions.page,
				count: data.executions.count,
				perPage: data.executions.pageSize,
				buttonCount: 5,
				urlForPage: (value) =>
					urlInfo.updateParamsURLGenerator({ searchParams: { page: value } }).url
			}}
			noneFoundText="No Executions Found"
			data={data.executions.data}
			currentOrder={data.searchParams?.orderBy}
			currentFilter={data.searchParams}
			filterModalTitle="Filter Executions"
			bind:numberRows={urlInfo.current.searchParams.pageSize}
			bind:filterOpened
			bind:shownColumns
			columns={[
				{
					id: 'status',
					title: 'Status',
					rowToDisplay: (row) => row.status,
					sortKey: 'status',
					showTitleOnMobile: true
				},
				{
					id: 'jobName',
					title: 'Job',
					rowToDisplay: (row) => row.jobName,
					sortKey: 'jobName'
				},
				{
					id: 'startedAt',
					title: 'Started At',
					rowToDisplay: (row) => formatDate(row.startedAt),
					sortKey: 'startedAt'
				},
				{
					id: 'duration',
					title: 'Duration',
					rowToDisplay: (row) => formatDuration(row.durationMs),
					sortKey: 'durationMs',
					showTitleOnMobile: false
				},
				{
					id: 'triggeredBy',
					title: 'Triggered By',
					rowToDisplay: (row) => row.triggeredBy,
					sortKey: 'triggeredBy',
					showTitleOnMobile: false
				},
				{ id: 'actions', title: '' }
			]}
		>
			{#snippet slotCustomBodyCell({ row: currentRow, currentColumn })}
				{#if currentColumn.id === 'status'}
					{@const statusBadge = getStatusBadge(currentRow.status)}
					<div class="flex items-center gap-2">
						<statusBadge.icon class="h-4 w-4" />
						<Badge color={statusBadge.color}>
							{currentRow.status}
						</Badge>
					</div>
					{#if currentRow.errorMessage}
						<p class="mt-1 text-xs text-red-600">
							{currentRow.errorMessage.substring(0, 100)}...
						</p>
					{/if}
				{:else if currentColumn.id === 'jobName'}
					{@const jobDetailURL = urlGenerator({
						address: '/(loggedIn)/admin/cron/[id]',
						paramsValue: { id: currentRow.cronJobId }
					}).url}
					<div>
						<a href={jobDetailURL} class="font-medium text-blue-600 hover:underline">
							{currentRow.jobName}
						</a>
					</div>
				{:else if currentColumn.id === 'triggeredBy'}
					<Badge color="gray">
						{currentRow.triggeredBy}
					</Badge>
					{#if currentRow.retryCount > 0}
						<Badge color="yellow" class="ml-1">
							Retry {currentRow.retryCount}
						</Badge>
					{/if}
				{:else if currentColumn.id === 'actions'}
					{@const jobDetailURL = urlGenerator({
						address: '/(loggedIn)/admin/cron/[id]',
						paramsValue: { id: currentRow.cronJobId }
					}).url}
					<div class="flex flex-row justify-center">
						<Button href={jobDetailURL} class="p-2" outline color="blue">
							<CronIcon height={15} width={15} />
						</Button>
					</div>
				{/if}
			{/snippet}

			{#snippet slotFilter()}
				{#if urlInfo.current.searchParams}
					<div class="flex flex-row gap-2">
						<Select
							bind:value={urlInfo.current.searchParams.cronJobId}
							placeholder="Filter by Job..."
							class="min-w-[200px]"
						>
							<option value="">All Jobs</option>
							{#each data.cronJobs as job}
								<option value={job.id}>{job.name}</option>
							{/each}
						</Select>

						<Select
							bind:value={urlInfo.current.searchParams.status}
							placeholder="Filter by Status..."
							class="min-w-[150px]"
						>
							{#each statusOptions as option}
								<option value={option.value}>{option.name}</option>
							{/each}
						</Select>

						<Select
							bind:value={urlInfo.current.searchParams.triggeredBy}
							placeholder="Filter by Trigger..."
							class="min-w-[150px]"
						>
							{#each triggeredByOptions as option}
								<option value={option.value}>{option.name}</option>
							{/each}
						</Select>
					</div>
				{/if}
			{/snippet}
		</CustomTable>
	{/if}
</PageLayout>
