<script lang="ts">
	import { Badge, Button, Card, Heading, Label, P } from 'flowbite-svelte';
	import {
		ArrowLeftOutline,
		CheckCircleOutline,
		ClockOutline,
		CloseCircleOutline,
		CogOutline,
		PlayOutline
	} from 'flowbite-svelte-icons';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { z } from 'zod';

	import { goto } from '$app/navigation';

	import CustomHeader from '$lib/components/CustomHeader.svelte';
	import PageLayout from '$lib/components/PageLayout.svelte';
	import { urlGenerator } from '$lib/routes.js';

	import type { ActionData, PageData } from './$types';

	export let data: PageData;
	export let form: ActionData;

	const triggerJobSchema = z.object({
		jobId: z.string().min(1, 'Job ID is required')
	});

	const updateConfigSchema = z.object({
		jobId: z.string().min(1, 'Job ID is required'),
		schedule: z.string().min(1, 'Schedule is required'),
		timeoutMs: z.number().min(1000, 'Timeout must be at least 1000ms'),
		maxRetries: z.number().min(0, 'Max retries must be non-negative')
	});

	const { form: triggerForm, enhance: triggerEnhance } = superForm(data.triggerJobForm, {
		validators: zod4Client(triggerJobSchema)
	});

	const { form: configForm, enhance: configEnhance } = superForm(data.updateConfigForm, {
		validators: zod4Client(updateConfigSchema),
		dataType: 'json'
	});

	let showConfigForm = false;

	function formatDuration(ms: number | null): string {
		if (!ms) return 'N/A';
		if (ms < 1000) return `${ms}ms`;
		if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
		return `${(ms / 60000).toFixed(1)}m`;
	}

	function formatDate(date: string | Date | null): string {
		if (!date) return 'Never';
		const dateObj = date instanceof Date ? date : new Date(date);
		return dateObj.toLocaleString();
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

	async function triggerJob() {
		$triggerForm.jobId = data.cronJob.id;
	}
</script>

<CustomHeader pageTitle={data.cronJob.name} filterText={[]} pageNumber={1} numPages={1} />

<PageLayout title={data.cronJob.name} size="xl">
	{#snippet slotRight()}
		<div class="flex gap-2">
			<Button color="primary" onclick={() => triggerJob()}>
				<PlayOutline class="mr-2 h-4 w-4" />
				Trigger Job
			</Button>

			<Button color="light" onclick={() => (showConfigForm = !showConfigForm)}>
				<CogOutline class="mr-2 h-4 w-4" />
				Configure
			</Button>

			<Button color="light" onclick={() => goto('/admin/cron')}>
				<ArrowLeftOutline class="mr-2 h-4 w-4" />
				Back to Cron Jobs
			</Button>
		</div>
	{/snippet}

	<!-- Statistics Cards -->
	<div class="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
		<div class="rounded-lg border bg-white p-4">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm font-medium text-gray-600">Total Executions</p>
					<p class="text-2xl font-bold">{data.cronJob.statistics.totalExecutions}</p>
				</div>
			</div>
		</div>

		<div class="rounded-lg border bg-white p-4">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm font-medium text-gray-600">Success Rate</p>
					<p class="text-2xl font-bold {getSuccessRateColor(data.cronJob.statistics.successRate)}">
						{data.cronJob.statistics.successRate}%
					</p>
				</div>
			</div>
		</div>

		<div class="rounded-lg border bg-white p-4">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm font-medium text-gray-600">Status</p>
					<p class="text-2xl font-bold">
						{#if data.cronJob.isEnabled}
							<Badge color="green">Enabled</Badge>
						{:else}
							<Badge color="red">Disabled</Badge>
						{/if}
					</p>
				</div>
			</div>
		</div>

		<div class="rounded-lg border bg-white p-4">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm font-medium text-gray-600">Failed Executions</p>
					<p class="text-2xl font-bold text-red-600">{data.cronJob.statistics.failedExecutions}</p>
				</div>
			</div>
		</div>
	</div>

	<!-- Success/Error Messages -->
	{#if form?.success}
		<div class="rounded border border-green-200 bg-green-50 px-4 py-3 text-green-800">
			{form.message}
		</div>
	{/if}

	{#if form?.message && !form?.success}
		<div class="rounded border border-red-200 bg-red-50 px-4 py-3 text-red-800">
			{form.message}
		</div>
	{/if}

	<!-- Job Details -->
	<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
		<!-- Basic Information -->
		<Card>
			<Heading tag="h3" class="mb-4 text-lg font-semibold">Job Information</Heading>
			<div class="space-y-3">
				<div>
					<P class="text-sm font-medium text-gray-600 dark:text-gray-400">Name</P>
					<P class="font-medium">{data.cronJob.name}</P>
				</div>

				<div>
					<P class="text-sm font-medium text-gray-600 dark:text-gray-400">Description</P>
					<P>{data.cronJob.description}</P>
				</div>

				<div>
					<P class="text-sm font-medium text-gray-600 dark:text-gray-400">Schedule</P>
					<code class="rounded bg-gray-100 px-2 py-1 text-sm">{data.cronJob.schedule}</code>
				</div>

				<div>
					<P class="text-sm font-medium text-gray-600 dark:text-gray-400">Status</P>
					{#if data.cronJob.isEnabled}
						<Badge color="green">Enabled</Badge>
					{:else}
						<Badge color="red">Disabled</Badge>
					{/if}
				</div>

				<div>
					<P class="text-sm font-medium text-gray-600 dark:text-gray-400">Timeout</P>
					<P>{formatDuration(data.cronJob.timeoutMs)}</P>
				</div>

				<div>
					<P class="text-sm font-medium text-gray-600 dark:text-gray-400">Max Retries</P>
					<P>{data.cronJob.maxRetries}</P>
				</div>

				<div>
					<P class="text-sm font-medium text-gray-600 dark:text-gray-400">Created</P>
					<P>{formatDate(data.cronJob.createdAt)}</P>
				</div>

				<div>
					<P class="text-sm font-medium text-gray-600 dark:text-gray-400">Last Modified</P>
					<P>{formatDate(data.cronJob.updatedAt)}</P>
					<P class="text-xs text-gray-500">by {data.cronJob.lastModifiedBy}</P>
				</div>
			</div>
		</Card>

		<!-- Statistics -->
		<Card>
			<Heading tag="h3" class="mb-4 text-lg font-semibold">Execution Statistics</Heading>
			<div class="space-y-4">
				<div class="grid grid-cols-2 gap-4">
					<div>
						<P class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Executions</P>
						<P class="text-2xl font-bold">{data.cronJob.statistics.totalExecutions}</P>
					</div>

					<div>
						<P class="text-sm font-medium text-gray-600 dark:text-gray-400">Success Rate</P>
						<P
							class="text-2xl font-bold {getSuccessRateColor(data.cronJob.statistics.successRate)}"
						>
							{data.cronJob.statistics.successRate}%
						</P>
					</div>
				</div>

				<div class="grid grid-cols-3 gap-4">
					<div>
						<P class="text-sm font-medium text-gray-600 dark:text-gray-400">Successful</P>
						<P class="text-lg font-semibold text-green-600">
							{data.cronJob.statistics.successfulExecutions}
						</P>
					</div>

					<div>
						<P class="text-sm font-medium text-gray-600 dark:text-gray-400">Failed</P>
						<P class="text-lg font-semibold text-red-600">
							{data.cronJob.statistics.failedExecutions}
						</P>
					</div>

					<div>
						<P class="text-sm font-medium text-gray-600 dark:text-gray-400">Timeouts</P>
						<P class="text-lg font-semibold text-yellow-600">
							{data.cronJob.statistics.timeoutExecutions}
						</P>
					</div>
				</div>

				{#if data.cronJob.recentExecutions.length > 0}
					{@const latestExecution = data.cronJob.recentExecutions[0]}
					{@const statusBadge = getStatusBadge(latestExecution.status)}
					<div class="border-t pt-4">
						<P class="mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">
							Latest Execution
						</P>
						<div class="mb-2 flex items-center gap-2">
							<svelte:component this={statusBadge.icon} class="h-4 w-4" />
							<Badge color={statusBadge.color}>{latestExecution.status}</Badge>
							<span class="text-sm text-gray-500">{formatDate(latestExecution.startedAt)}</span>
						</div>
						<P class="text-sm">Duration: {formatDuration(latestExecution.durationMs)}</P>
						{#if latestExecution.errorMessage}
							<P class="mt-2 text-sm text-red-600">{latestExecution.errorMessage}</P>
						{/if}
					</div>
				{/if}
			</div>
		</Card>
	</div>

	<!-- Configuration Form -->
	{#if showConfigForm}
		<Card>
			<Heading tag="h3" class="mb-4 text-lg font-semibold">Update Configuration</Heading>
			<form method="POST" action="?/updateConfig" use:configEnhance class="space-y-4">
				<input type="hidden" name="jobId" bind:value={$configForm.jobId} />

				<div>
					<Label for="schedule">Cron Schedule</Label>
					<input
						id="schedule"
						name="schedule"
						type="text"
						bind:value={$configForm.schedule}
						placeholder="0 0 * * *"
						required
						class="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
					/>
					<P class="mt-1 text-xs text-gray-500">
						Use standard cron format: minute hour day month weekday
					</P>
				</div>

				<div>
					<Label for="timeoutMs">Timeout (milliseconds)</Label>
					<input
						id="timeoutMs"
						name="timeoutMs"
						type="number"
						bind:value={$configForm.timeoutMs}
						min="1000"
						required
						class="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
					/>
				</div>

				<div>
					<Label for="maxRetries">Max Retries</Label>
					<input
						id="maxRetries"
						name="maxRetries"
						type="number"
						bind:value={$configForm.maxRetries}
						min="0"
						required
						class="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
					/>
				</div>

				<div class="flex gap-2">
					<Button type="submit" color="primary">Update Configuration</Button>
					<Button type="button" color="light" onclick={() => (showConfigForm = false)}>
						Cancel
					</Button>
				</div>
			</form>
		</Card>
	{/if}

	<!-- Hidden Trigger Form -->
	<form method="POST" action="?/triggerJob" use:triggerEnhance style="display: none;">
		<input type="hidden" name="jobId" bind:value={$triggerForm.jobId} />
	</form>

	<!-- Quick Actions -->
	<Card>
		<Heading tag="h3" class="mb-4 text-lg font-semibold">Quick Actions</Heading>
		<div class="flex gap-4">
			<Button
				href={urlGenerator({
					address: '/(loggedIn)/admin/cron/executions',
					searchParamsValue: {
						cronJobId: data.cronJob.id,
						page: 0,
						pageSize: 25,
						orderBy: [{ field: 'startedAt', direction: 'desc' }]
					}
				}).url}
				color="blue"
				outline
			>
				<ClockOutline class="mr-2 h-4 w-4" />
				View All Executions
			</Button>

			<Button
				href={urlGenerator({
					address: '/(loggedIn)/admin/cron/executions',
					searchParamsValue: {
						cronJobId: data.cronJob.id,
						status: 'failed',
						page: 0,
						pageSize: 25,
						orderBy: [{ field: 'startedAt', direction: 'desc' }]
					}
				}).url}
				color="red"
				outline
			>
				<CloseCircleOutline class="mr-2 h-4 w-4" />
				View Failures
			</Button>
		</div>
	</Card>

	<!-- Recent Executions Summary -->
	<Card>
		<Heading tag="h3" class="mb-4 text-lg font-semibold">Recent Executions (Last 10)</Heading>

		{#if data.executionHistory.length > 0}
			<div class="space-y-3">
				{#each data.executionHistory.slice(0, 10) as execution}
					{@const statusBadge = getStatusBadge(execution.status)}
					<div class="flex items-center justify-between rounded-lg bg-gray-50 p-3">
						<div class="flex items-center gap-3">
							<svelte:component this={statusBadge.icon} class="h-5 w-5" />
							<div>
								<p class="font-medium">{formatDate(execution.startedAt)}</p>
								<p class="text-sm text-gray-500">
									Duration: {formatDuration(execution.durationMs)} • Triggered by: {execution.triggeredBy}
								</p>
							</div>
						</div>
						<div class="text-right">
							<Badge color={statusBadge.color}>{execution.status}</Badge>
							{#if execution.retryCount > 0}
								<Badge color="yellow" class="ml-1">Retry {execution.retryCount}</Badge>
							{/if}
						</div>
					</div>
				{/each}
			</div>

			{#if data.executionHistory.length > 10}
				<div class="mt-4 text-center">
					<Button
						href={urlGenerator({
							address: '/(loggedIn)/admin/cron/executions',
							searchParamsValue: {
								cronJobId: data.cronJob.id,
								page: 0,
								pageSize: 25,
								orderBy: [{ field: 'startedAt', direction: 'desc' }]
							}
						}).url}
						color="light"
						outline
					>
						View All {data.executionHistory.length} Executions
					</Button>
				</div>
			{/if}
		{:else}
			<p class="py-8 text-center text-gray-500">No execution history available</p>
		{/if}
	</Card>
</PageLayout>
