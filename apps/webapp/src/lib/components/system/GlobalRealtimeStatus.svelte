<script lang="ts">
	import { Badge, Spinner } from 'flowbite-svelte';

	import type { RealtimeEventMap, RealtimeLongProcess, RealtimeSnapshot } from '@totallator/shared';

	import { type SSEConnectionStatus, useSSE } from '$lib/client/useSSE.svelte';

	const eventStreamUrl = '/api/system/long-process/stream';

	let snapshot = $state<RealtimeSnapshot>({
		writeLock: { enabled: false, locked: false },
		activeLongProcesses: [],
		latestLongProcess: null
	});
	let connectionStatus = $state<SSEConnectionStatus>('idle');

	const activeProcess = $derived(snapshot.activeLongProcesses[0] ?? null);
	const showConnectionWarning = $derived(
		connectionStatus === 'reconnecting' || connectionStatus === 'error'
	);
	const showStatus = $derived(showConnectionWarning || snapshot.writeLock.locked || activeProcess);

	const mergeProcess = (process: RealtimeLongProcess) => {
		const existing = snapshot.activeLongProcesses.filter((item) => item.jobId !== process.jobId);
		const activeLongProcesses = process.status === 'running' ? [process, ...existing] : existing;

		snapshot = {
			...snapshot,
			activeLongProcesses,
			latestLongProcess: process
		};
	};

	useSSE<RealtimeEventMap, 'system.snapshot'>({
		url: eventStreamUrl,
		event: 'system.snapshot',
		callback: (data) => {
			snapshot = data;
		},
		onStatusChange: (status) => {
			connectionStatus = status;
		}
	});

	useSSE<RealtimeEventMap, 'write_lock.changed'>({
		url: eventStreamUrl,
		event: 'write_lock.changed',
		callback: (writeLock) => {
			snapshot = {
				...snapshot,
				writeLock
			};
		}
	});

	useSSE<RealtimeEventMap, 'long_process.started'>({
		url: eventStreamUrl,
		event: 'long_process.started',
		callback: mergeProcess
	});

	useSSE<RealtimeEventMap, 'long_process.progress'>({
		url: eventStreamUrl,
		event: 'long_process.progress',
		callback: mergeProcess
	});

	useSSE<RealtimeEventMap, 'long_process.completed'>({
		url: eventStreamUrl,
		event: 'long_process.completed',
		callback: mergeProcess
	});

	useSSE<RealtimeEventMap, 'long_process.failed'>({
		url: eventStreamUrl,
		event: 'long_process.failed',
		callback: mergeProcess
	});
</script>

{#if showStatus}
	<div class="mb-3 flex flex-col gap-2">
		{#if snapshot.writeLock.locked}
			<div
				class="rounded border border-amber-200 bg-amber-50 p-3 text-sm dark:border-amber-900 dark:bg-amber-950/30"
			>
				<div class="font-medium text-amber-900 dark:text-amber-200">Write operations locked</div>
				<div class="text-amber-700 dark:text-amber-300">
					{snapshot.writeLock.processType || 'Long-running process active'}
					{#if snapshot.writeLock.reason}
						: {snapshot.writeLock.reason}
					{/if}
				</div>
			</div>
		{/if}

		{#if activeProcess}
			<div
				class="rounded border border-blue-200 bg-blue-50 p-3 text-sm dark:border-blue-900 dark:bg-blue-950/30"
			>
				<div class="flex items-center justify-between gap-4">
					<div>
						<div class="font-medium text-blue-900 dark:text-blue-200">
							{activeProcess.label}
						</div>
						<div class="text-blue-700 dark:text-blue-300">
							{activeProcess.message || activeProcess.processType} ({activeProcess.progress}%)
						</div>
					</div>
					<Badge color="blue">
						<div class="flex items-center gap-2">
							<Spinner size="4" color="green" />
							Running
						</div>
					</Badge>
				</div>
			</div>
		{/if}

		{#if showConnectionWarning}
			<div
				class="rounded border border-red-200 bg-red-50 p-3 text-sm dark:border-red-900 dark:bg-red-950/30"
			>
				<div class="font-medium text-red-900 dark:text-red-200">Realtime connection issue</div>
				<div class="text-red-700 dark:text-red-300">
					Connection status: {connectionStatus}
				</div>
			</div>
		{/if}
	</div>
{/if}
