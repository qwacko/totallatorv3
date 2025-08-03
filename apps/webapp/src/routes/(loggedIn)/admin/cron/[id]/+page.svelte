<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { Badge, Button, Card, P, Heading, Label } from 'flowbite-svelte';
	import { ArrowLeftOutline, PlayOutline, CheckCircleOutline, CloseCircleOutline, ClockOutline, CogOutline } from 'flowbite-svelte-icons';
	import PageLayout from '$lib/components/PageLayout.svelte';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { z } from 'zod';
	import { goto } from '$app/navigation';
	import { urlGenerator } from '$lib/routes.js';

	export let data: PageData;
	export let form: ActionData;

	const triggerJobSchema = z.object({
		jobId: z.string().min(1, 'Job ID is required'),
	});

	const updateConfigSchema = z.object({
		jobId: z.string().min(1, 'Job ID is required'),
		schedule: z.string().min(1, 'Schedule is required'),
		timeoutMs: z.number().min(1000, 'Timeout must be at least 1000ms'),
		maxRetries: z.number().min(0, 'Max retries must be non-negative'),
	});

	const { form: triggerForm, enhance: triggerEnhance } = superForm(data.triggerJobForm, {
		validators: zod4Client(triggerJobSchema),
	});

	const { form: configForm, enhance: configEnhance } = superForm(data.updateConfigForm, {
		validators: zod4Client(updateConfigSchema),
		dataType: 'json',
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

<PageLayout title={data.cronJob.name}>
	<div class="space-y-6">
		<!-- Header with Back Button -->
		<div class="flex items-center justify-between">
			<Button color="light" onclick={() => goto('/admin/cron')}>
				<ArrowLeftOutline class="w-4 h-4 mr-2" />
				Back to Cron Jobs
			</Button>
			
			<div class="flex gap-2">
				<Button
					color="primary"
					onclick={() => triggerJob()}
				>
					<PlayOutline class="w-4 h-4 mr-2" />
					Trigger Job
				</Button>
				
				<Button
					color="light"
					onclick={() => showConfigForm = !showConfigForm}
				>
					<CogOutline class="w-4 h-4 mr-2" />
					Configure
				</Button>
			</div>
		</div>

		<!-- Success/Error Messages -->
		{#if form?.success}
			<div class="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded">
				{form.message}
			</div>
		{/if}

		{#if form?.message && !form?.success}
			<div class="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
				{form.message}
			</div>
		{/if}

		<!-- Job Details -->
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
			<!-- Basic Information -->
			<Card>
				<Heading tag="h3" class="text-lg font-semibold mb-4">Job Information</Heading>
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
						<code class="text-sm bg-gray-100 px-2 py-1 rounded">{data.cronJob.schedule}</code>
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
				<Heading tag="h3" class="text-lg font-semibold mb-4">Execution Statistics</Heading>
				<div class="space-y-4">
					<div class="grid grid-cols-2 gap-4">
						<div>
							<P class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Executions</P>
							<P class="text-2xl font-bold">{data.cronJob.statistics.totalExecutions}</P>
						</div>
						
						<div>
							<P class="text-sm font-medium text-gray-600 dark:text-gray-400">Success Rate</P>
							<P class="text-2xl font-bold {getSuccessRateColor(data.cronJob.statistics.successRate)}">
								{data.cronJob.statistics.successRate}%
							</P>
						</div>
					</div>
					
					<div class="grid grid-cols-3 gap-4">
						<div>
							<P class="text-sm font-medium text-gray-600 dark:text-gray-400">Successful</P>
							<P class="text-lg font-semibold text-green-600">{data.cronJob.statistics.successfulExecutions}</P>
						</div>
						
						<div>
							<P class="text-sm font-medium text-gray-600 dark:text-gray-400">Failed</P>
							<P class="text-lg font-semibold text-red-600">{data.cronJob.statistics.failedExecutions}</P>
						</div>
						
						<div>
							<P class="text-sm font-medium text-gray-600 dark:text-gray-400">Timeouts</P>
							<P class="text-lg font-semibold text-yellow-600">{data.cronJob.statistics.timeoutExecutions}</P>
						</div>
					</div>

					{#if data.cronJob.recentExecutions.length > 0}
						{@const latestExecution = data.cronJob.recentExecutions[0]}
						{@const statusBadge = getStatusBadge(latestExecution.status)}
						<div class="pt-4 border-t">
							<P class="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Latest Execution</P>
							<div class="flex items-center gap-2 mb-2">
								<svelte:component this={statusBadge.icon} class="w-4 h-4" />
								<Badge color={statusBadge.color}>{latestExecution.status}</Badge>
								<span class="text-sm text-gray-500">{formatDate(latestExecution.startedAt)}</span>
							</div>
							<P class="text-sm">Duration: {formatDuration(latestExecution.durationMs)}</P>
							{#if latestExecution.errorMessage}
								<P class="text-sm text-red-600 mt-2">{latestExecution.errorMessage}</P>
							{/if}
						</div>
					{/if}
				</div>
			</Card>
		</div>

		<!-- Configuration Form -->
		{#if showConfigForm}
			<Card>
				<Heading tag="h3" class="text-lg font-semibold mb-4">Update Configuration</Heading>
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
							class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
						/>
						<P class="text-xs text-gray-500 mt-1">
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
							class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
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
							class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
						/>
					</div>
					
					<div class="flex gap-2">
						<Button type="submit" color="primary">Update Configuration</Button>
						<Button type="button" color="light" onclick={() => showConfigForm = false}>
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
			<Heading tag="h3" class="text-lg font-semibold mb-4">Quick Actions</Heading>
			<div class="flex gap-4">
				<Button
					href={urlGenerator({
						address: "/(loggedIn)/admin/cron/executions",
						searchParamsValue: { 
							jobId: data.cronJob.id,
							page: 1,
							pageSize: 25,
							orderBy: 'startedAt-desc'
						},
					}).url}
					color="blue"
					outline
				>
					<ClockOutline class="w-4 h-4 mr-2" />
					View All Executions
				</Button>
				
				<Button
					href={urlGenerator({
						address: "/(loggedIn)/admin/cron/executions",
						searchParamsValue: { 
							jobId: data.cronJob.id, 
							status: 'failed',
							page: 1,
							pageSize: 25,
							orderBy: 'startedAt-desc'
						},
					}).url}
					color="red"
					outline
				>
					<CloseCircleOutline class="w-4 h-4 mr-2" />
					View Failures
				</Button>
			</div>
		</Card>

		<!-- Recent Executions Summary -->
		<Card>
			<Heading tag="h3" class="text-lg font-semibold mb-4">Recent Executions (Last 10)</Heading>
			
			{#if data.executionHistory.length > 0}
				<div class="space-y-3">
					{#each data.executionHistory.slice(0, 10) as execution}
						{@const statusBadge = getStatusBadge(execution.status)}
						<div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
							<div class="flex items-center gap-3">
								<svelte:component this={statusBadge.icon} class="w-5 h-5" />
								<div>
									<p class="font-medium">{formatDate(execution.startedAt)}</p>
									<p class="text-sm text-gray-500">
										Duration: {formatDuration(execution.durationMs)} • 
										Triggered by: {execution.triggeredBy}
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
								address: "/(loggedIn)/admin/cron/executions",
								searchParamsValue: { 
									jobId: data.cronJob.id,
									page: 1,
									pageSize: 25,
									orderBy: 'startedAt-desc'
								},
							}).url}
							color="light"
							outline
						>
							View All {data.executionHistory.length} Executions
						</Button>
					</div>
				{/if}
			{:else}
				<p class="text-gray-500 text-center py-8">No execution history available</p>
			{/if}
		</Card>
	</div>
</PageLayout>