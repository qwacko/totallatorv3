<script lang="ts">
	import { Button, ButtonGroup, Badge } from 'flowbite-svelte';
	import { PlayOutline, PauseOutline, CheckCircleOutline, CloseCircleOutline, ClockOutline } from 'flowbite-svelte-icons';
	import { onNavigate } from '$app/navigation';
	
	import type { PageData, ActionData } from './$types';
	import { urlGenerator } from '$lib/routes.js';
	import PageLayout from '$lib/components/PageLayout.svelte';
	import CustomTable from '$lib/components/table/CustomTable.svelte';
	import CustomHeader from '$lib/components/CustomHeader.svelte';
	import EditIcon from '$lib/components/icons/EditIcon.svelte';
	import CronIcon from '$lib/components/icons/CronIcon.svelte';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { z } from 'zod';

	const { data, form }: { data: PageData; form: ActionData } = $props();

	let filterOpened = $state(false);
	let shownColumns = $state(['actions', 'name', 'schedule', 'status', 'lastRun', 'successRate']);

	onNavigate(() => {
		filterOpened = false;
	});

	const triggerJobSchema = z.object({
		jobId: z.string().min(1, 'Job ID is required'),
	});

	const toggleJobSchema = z.object({
		jobId: z.string().min(1, 'Job ID is required'),
		isEnabled: z.boolean(),
	});

	const { form: triggerForm, enhance: triggerEnhance } = superForm(data.triggerJobForm, {
		validators: zod4Client(triggerJobSchema),
	});

	const { form: toggleForm, enhance: toggleEnhance } = superForm(data.toggleJobForm, {
		validators: zod4Client(toggleJobSchema),
	});

	// Remove unused formatDuration function

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

	function getSuccessRateColor(rate: number): string {
		if (rate >= 95) return 'text-green-600';
		if (rate >= 80) return 'text-yellow-600';
		return 'text-red-600';
	}

	async function triggerJob(jobId: string) {
		$triggerForm.jobId = jobId;
		const formElement = document.querySelector(`#trigger-form-${jobId}`) as HTMLFormElement;
		if (formElement) {
			formElement.requestSubmit();
		}
	}

	async function toggleJob(jobId: string, currentEnabled: boolean) {
		$toggleForm.jobId = jobId;
		$toggleForm.isEnabled = !currentEnabled;
		const formElement = document.querySelector(`#toggle-form-${jobId}`) as HTMLFormElement;
		if (formElement) {
			formElement.requestSubmit();
		}
	}
</script>

<CustomHeader
	pageTitle="Cron Jobs"
	filterText={[]}
	pageNumber={1}
	numPages={1}
/>

<PageLayout title="Cron Jobs" size="xl">
	{#snippet slotRight()}
		<Button
			href={urlGenerator({ 
				address: "/(loggedIn)/admin/cron/executions",
				searchParamsValue: { page: 0, pageSize: 25, orderBy: [{ field: 'startedAt', direction: 'desc' }] }
			}).url}
			color="light"
			outline
		>
			<CronIcon class="w-4 h-4 mr-2" />
			View All Executions
		</Button>
	{/snippet}

	<!-- Statistics Cards -->
	<div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
		<div class="bg-white p-4 rounded-lg border">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm font-medium text-gray-600">Total Jobs</p>
					<p class="text-2xl font-bold">{data.cronJobs.length}</p>
				</div>
			</div>
		</div>

		<div class="bg-white p-4 rounded-lg border">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm font-medium text-gray-600">Active Jobs</p>
					<p class="text-2xl font-bold text-green-600">
						{data.cronJobs.filter(job => job.isEnabled).length}
					</p>
				</div>
			</div>
		</div>

		<div class="bg-white p-4 rounded-lg border">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm font-medium text-gray-600">Total Executions</p>
					<p class="text-2xl font-bold">{data.statistics.totalExecutions}</p>
					<p class="text-xs text-gray-500">{data.statistics.period}</p>
				</div>
			</div>
		</div>

		<div class="bg-white p-4 rounded-lg border">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm font-medium text-gray-600">Success Rate</p>
					<p class="text-2xl font-bold {getSuccessRateColor(data.statistics.successRate)}">
						{data.statistics.successRate}%
					</p>
				</div>
			</div>
		</div>
	</div>

	<!-- Success/Error Messages -->
	{#if form?.success}
		<div class="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded mb-4">
			{form.message}
		</div>
	{/if}

	{#if form?.message && !form?.success}
		<div class="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-4">
			{form.message}
		</div>
	{/if}

	<!-- Main Table -->
	<CustomTable
		data={data.cronJobs}
		bind:shownColumns
		bind:filterOpened
		columns={[
			{ id: "actions", title: "" },
			{
				id: "name",
				title: "Job Name",
				rowToDisplay: (row) => row.name,
				sortKey: "name",
			},
			{
				id: "schedule",
				title: "Schedule",
				rowToDisplay: (row) => row.schedule,
				sortKey: "schedule",
				showTitleOnMobile: false,
			},
			{
				id: "status",
				title: "Status",
				rowToDisplay: (row) => row.isEnabled ? "Enabled" : "Disabled",
				sortKey: "isEnabled",
				showTitleOnMobile: true,
			},
			{
				id: "lastRun",
				title: "Last Run",
				rowToDisplay: (row) => formatDate(row.latestExecution?.startedAt),
				sortKey: "lastRun",
				showTitleOnMobile: false,
			},
			{
				id: "successRate",
				title: "Success Rate",
				rowToDisplay: (row) => `${row.statistics.successRate}%`,
				sortKey: "successRate",
				showTitleOnMobile: false,
			},
		]}
		noneFoundText="No Cron Jobs Found"
		rowColour={(row) => (row.isEnabled ? undefined : "grey")}
	>
		{#snippet slotCustomBodyCell({ row: currentRow, currentColumn })}
			{#if currentColumn.id === "actions"}
				{@const detailURL = urlGenerator({
					address: "/(loggedIn)/admin/cron/[id]",
					paramsValue: { id: currentRow.id },
				}).url}

				{@const executionsURL = urlGenerator({
					address: "/(loggedIn)/admin/cron/executions",
					searchParamsValue: { 
						cronJobId: currentRow.id,
						page: 0, 
						pageSize: 25, 
						orderBy: [{ field: 'startedAt', direction: 'desc' }] 
					},
				}).url}

				<!-- Hidden Forms -->
				<form 
					id="trigger-form-{currentRow.id}" 
					method="POST" 
					action="?/triggerJob"
					use:triggerEnhance
					style="display: none;"
				>
					<input type="hidden" name="jobId" bind:value={$triggerForm.jobId} />
				</form>

				<form 
					id="toggle-form-{currentRow.id}" 
					method="POST" 
					action="?/toggleJob"
					use:toggleEnhance
					style="display: none;"
				>
					<input type="hidden" name="jobId" bind:value={$toggleForm.jobId} />
					<input type="hidden" name="isEnabled" bind:value={$toggleForm.isEnabled} />
				</form>

				<div class="flex flex-row justify-center">
					<ButtonGroup>
						<Button href={executionsURL} class="p-2" outline color="blue">
							<CronIcon height={15} width={15} />
						</Button>
						<Button
							class="p-2"
							color="primary"
							outline
							onclick={() => triggerJob(currentRow.id)}
						>
							<PlayOutline class="w-3 h-3" />
						</Button>
						<Button
							class="p-2"
							color={currentRow.isEnabled ? 'red' : 'green'}
							outline
							onclick={() => toggleJob(currentRow.id, currentRow.isEnabled)}
						>
							{#if currentRow.isEnabled}
								<PauseOutline class="w-3 h-3" />
							{:else}
								<PlayOutline class="w-3 h-3" />
							{/if}
						</Button>
						<Button href={detailURL} class="p-2" outline>
							<EditIcon height={15} width={15} />
						</Button>
					</ButtonGroup>
				</div>
			{:else if currentColumn.id === "name"}
				<div>
					<p class="font-medium">{currentRow.name}</p>
					<p class="text-sm text-gray-500">{currentRow.description}</p>
				</div>
			{:else if currentColumn.id === "schedule"}
				<code class="text-xs bg-gray-100 px-2 py-1 rounded">{currentRow.schedule}</code>
			{:else if currentColumn.id === "status"}
				{#if currentRow.isEnabled}
					<Badge color="green">Enabled</Badge>
				{:else}
					<Badge color="red">Disabled</Badge>
				{/if}
			{:else if currentColumn.id === "lastRun"}
				{#if currentRow.latestExecution}
					{@const statusBadge = getStatusBadge(currentRow.latestExecution.status)}
					<div class="flex items-center gap-2">
						<statusBadge.icon class="w-4 h-4" />
						<span class="text-sm">
							{formatDate(currentRow.latestExecution.startedAt)}
						</span>
					</div>
					{#if currentRow.latestExecution.errorMessage}
						<p class="text-xs text-red-600 mt-1">
							{currentRow.latestExecution.errorMessage}
						</p>
					{/if}
				{:else}
					<span class="text-gray-500">Never</span>
				{/if}
			{:else if currentColumn.id === "successRate"}
				<span class="{getSuccessRateColor(currentRow.statistics.successRate)} font-medium">
					{currentRow.statistics.successRate}%
				</span>
				<p class="text-xs text-gray-500">
					{currentRow.statistics.successfulExecutions}/{currentRow.statistics.totalExecutions}
				</p>
			{/if}
		{/snippet}
	</CustomTable>
</PageLayout>