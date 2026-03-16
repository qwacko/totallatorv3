<script lang="ts">
	import { Badge, Heading, Toast } from 'flowbite-svelte';
	import { blur } from 'svelte/transition';

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
	const activeProcessProgress = $derived(Math.max(0, Math.min(100, activeProcess?.progress ?? 0)));

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
	<div class="pointer-events-none fixed top-4 right-4 z-40 flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-3">
		{#if snapshot.writeLock.locked}
			<Toast
				class="pointer-events-auto w-full border-amber-200 bg-amber-50/95 text-amber-950 shadow-lg backdrop-blur dark:border-amber-900 dark:bg-amber-950/85 dark:text-amber-100"
				color="yellow"
				transition={blur}
				params={{ amount: 10 }}
			>
				<Heading tag="h2" class="text-sm font-semibold text-amber-900 dark:text-amber-100">
					Write operations locked
				</Heading>
				<div class="text-sm text-amber-700 dark:text-amber-300">
					{snapshot.writeLock.processType || 'Long-running process active'}
					{#if snapshot.writeLock.reason}
						: {snapshot.writeLock.reason}
					{/if}
				</div>
			</Toast>
		{/if}

		{#if activeProcess}
			<Toast
				class="pointer-events-auto w-full border-blue-200 bg-blue-50/95 text-blue-950 shadow-lg backdrop-blur dark:border-blue-900 dark:bg-blue-950/85 dark:text-blue-100"
				color="blue"
				transition={blur}
				params={{ amount: 10 }}
			>
				<div class="flex items-start justify-between gap-4">
					<div class="min-w-0 flex-1">
						<Heading tag="h2" class="truncate text-sm font-semibold text-blue-900 dark:text-blue-100">
							{activeProcess.label}
						</Heading>
						<div class="truncate text-sm text-blue-700 dark:text-blue-300">
							{activeProcess.message || activeProcess.processType}
						</div>
						<div class="mt-3 h-2 overflow-hidden rounded-full bg-blue-200/70 dark:bg-blue-900/70">
							<div
								class="h-full rounded-full bg-blue-600 transition-[width] duration-300 dark:bg-blue-400"
								style={`width: ${activeProcessProgress}%`}
							></div>
						</div>
						<div class="mt-2 text-xs font-medium tracking-wide text-blue-700 dark:text-blue-300">
							{activeProcessProgress}%
						</div>
					</div>
					<Badge color="blue" large>Running</Badge>
				</div>
			</Toast>
		{/if}

		{#if showConnectionWarning}
			<Toast
				class="pointer-events-auto w-full border-red-200 bg-red-50/95 text-red-950 shadow-lg backdrop-blur dark:border-red-900 dark:bg-red-950/85 dark:text-red-100"
				color="red"
				transition={blur}
				params={{ amount: 10 }}
			>
				<Heading tag="h2" class="text-sm font-semibold text-red-900 dark:text-red-100">
					Realtime connection issue
				</Heading>
				<div class="text-sm text-red-700 dark:text-red-300">Connection status: {connectionStatus}</div>
			</Toast>
		{/if}
	</div>
{/if}
