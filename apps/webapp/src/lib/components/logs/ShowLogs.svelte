<script lang="ts">
	import {
		Badge,
		Button,
		ButtonGroup,
		Input,
		Modal,
		PaginationNav,
		Table,
		TableBody,
		TableBodyCell,
		TableBodyRow,
		TableHead,
		TableHeadCell
	} from 'flowbite-svelte';
	import { EyeOutline, RefreshOutline, SearchOutline } from 'flowbite-svelte-icons';
	import { useInterval } from 'runed';

	import type { LogFilterValidationType } from '@totallator/shared';

	import { highlightText } from './highlightText';
	import { getLogs } from './logsDisplay.remote';

	let filter = $state<LogFilterValidationType & { limit: number; offset: number }>({
		limit: 100,
		offset: 0
	});
	let refreshInterval = $state<number>(2000);

	// Modal state for showing full log details
	let showModal = $state(false);
	let selectedLog = $state<any>(null);

	const logs = $derived(await getLogs(filter));

	const currentPage = $derived(Math.floor(filter.offset / filter.limit) + 1);
	const totalPages = $derived(Math.ceil(logs.logCount / filter.limit));
	$effect(() => {
		if (currentPage > totalPages) {
			filter.offset = Math.max(0, (totalPages - 1) * filter.limit);
		}
	});
	let updateTime = $state(new Date());

	const interval = useInterval(
		async () => {
			await getLogs(filter).refresh();
			updateTime = new Date();
		},
		() => refreshInterval
	);

	const refreshNow = async () => {
		await getLogs(filter).refresh();
		updateTime = new Date();
	};

	const toggleItem = (
		key:
			| 'domain'
			| 'action'
			| 'contextId'
			| 'code'
			| 'level'
			| 'requestId'
			| 'routeId'
			| 'userId'
			| 'url',
		value: string | undefined | null
	) => {
		if (!value) {
			return;
		}
		const currentValue = filter[key] || [];
		if (currentValue.includes(value as any)) {
			filter[key] = currentValue.filter((item) => item !== value) as any;
		} else {
			filter[key] = [...currentValue, value as any];
		}
	};

	const getLevelColor = (level: string) => {
		switch (level?.toUpperCase()) {
			case 'ERROR':
				return 'red';
			case 'WARN':
				return 'yellow';
			case 'INFO':
				return 'blue';
			case 'DEBUG':
				return 'gray';
			case 'TRACE':
				return 'gray';
			default:
				return 'gray';
		}
	};

	const openLogModal = (log: any) => {
		selectedLog = log;
		showModal = true;
	};
</script>

<!-- Header Section -->
<div class="mb-6 flex items-center justify-between">
	<div class="flex items-center gap-4">
		<h2 class="text-xl font-semibold text-gray-900 dark:text-white">Log Viewer</h2>
		<svelte:boundary>
			<Badge color="gray" class="text-xs">Last updated: {updateTime.toISOString()}</Badge>
			{#snippet failed(error, reset)}
				<button onclick={reset}>oops! try again</button>
				<pre>{JSON.stringify(error, null, 2)}</pre>
			{/snippet}
		</svelte:boundary>
	</div>
	<div class="flex items-center gap-2">
		<Button size="sm" color="alternative" onclick={refreshNow}>
			<RefreshOutline class="mr-2 h-4 w-4" />
			Refresh
		</Button>
	</div>
</div>
<!-- Controls Section -->
<div class="mb-6 space-y-4">
	<!-- Search and Auto-refresh -->
	<svelte:boundary>
		{#snippet failed(error, reset)}
			<button onclick={reset}>oops! try again</button>
			<pre>{JSON.stringify(error, null, 2)}</pre>
		{/snippet}
		<div class="flex items-end gap-4">
			<div class="flex-1">
				<label for="search" class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
					Search in logs
				</label>
				<div class="relative">
					<SearchOutline
						class="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400"
					/>
					<Input
						id="search"
						placeholder="Search log titles and data..."
						bind:value={filter.text}
						class="pl-10"
					/>
				</div>
			</div>
			<div>
				<label
					for="auto-refresh"
					class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
				>
					Auto-refresh
				</label>
				<ButtonGroup id="auto-refresh">
					{#each [0, 0.5, 1, 2, 5, 10] as currentInterval}
						<Button
							size="sm"
							color={currentInterval === refreshInterval / 1000 ? 'blue' : 'alternative'}
							onclick={() => {
								refreshInterval = currentInterval * 1000;
								interval.pause();
								if (refreshInterval !== 0) {
									interval.resume();
								}
							}}
						>
							{#if currentInterval === 0}Off{:else}{currentInterval}s{/if}
						</Button>
					{/each}
				</ButtonGroup>
			</div>
		</div>
	</svelte:boundary>

	<svelte:boundary>
		{#snippet failed(error, reset)}
			<button onclick={reset}>oops! try again</button>
			<pre>{JSON.stringify(error, null, 2)}</pre>
		{/snippet}
		<!-- Active Filters -->
		{#if filter.contextId?.length || filter.domain?.length || filter.code?.length || filter.level?.length || filter.action?.length || filter.requestId?.length || filter.routeId?.length || filter.userId?.length || filter.url?.length}
			<div class="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
				<h4 class="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Active Filters:</h4>
				<div class="flex flex-wrap gap-2">
					{#if filter.contextId}
						{#each filter.contextId as currentContextId}
							<Badge
								color="purple"
								onclick={() => {
									toggleItem('contextId', currentContextId);
								}}
								class="cursor-pointer hover:bg-purple-200"
							>
								Context: {currentContextId} ×
							</Badge>
						{/each}
					{/if}
					{#if filter.domain}
						{#each filter.domain as currentDomain}
							<Badge
								color="green"
								onclick={() => {
									toggleItem('domain', currentDomain);
								}}
								class="cursor-pointer hover:bg-green-200"
							>
								Domain: {currentDomain} ×
							</Badge>
						{/each}
					{/if}
					{#if filter.code}
						{#each filter.code as currentCode}
							<Badge
								color="indigo"
								onclick={() => {
									toggleItem('code', currentCode);
								}}
								class="cursor-pointer hover:bg-indigo-200"
							>
								Code: {currentCode} ×
							</Badge>
						{/each}
					{/if}
					{#if filter.level}
						{#each filter.level as currentLevel}
							<Badge
								color={getLevelColor(currentLevel)}
								onclick={() => {
									toggleItem('level', currentLevel);
								}}
								class="cursor-pointer"
							>
								Level: {currentLevel} ×
							</Badge>
						{/each}
					{/if}
					{#if filter.action}
						{#each filter.action as currentAction}
							<Badge
								color="blue"
								onclick={() => {
									toggleItem('action', currentAction);
								}}
								class="cursor-pointer hover:bg-blue-200"
							>
								Action: {currentAction} ×
							</Badge>
						{/each}
					{/if}
					{#if filter.requestId}
						{#each filter.requestId as currentRequestId}
							<Badge
								color="cyan"
								onclick={() => {
									toggleItem('requestId', currentRequestId);
								}}
								class="cursor-pointer hover:bg-cyan-200"
							>
								Request: {currentRequestId?.substring(0, 8)}... ×
							</Badge>
						{/each}
					{/if}
					{#if filter.routeId}
						{#each filter.routeId as currentRouteId}
							<Badge
								color="pink"
								onclick={() => {
									toggleItem('routeId', currentRouteId);
								}}
								class="cursor-pointer hover:bg-pink-200"
							>
								Route: {currentRouteId} ×
							</Badge>
						{/each}
					{/if}
					{#if filter.userId}
						{#each filter.userId as currentUserId}
							<Badge
								color="orange"
								onclick={() => {
									toggleItem('userId', currentUserId);
								}}
								class="cursor-pointer hover:bg-orange-200"
							>
								User: {currentUserId} ×
							</Badge>
						{/each}
					{/if}
					{#if filter.url}
						{#each filter.url as currentUrl}
							<Badge
								color="yellow"
								onclick={() => {
									toggleItem('url', currentUrl);
								}}
								class="cursor-pointer hover:bg-yellow-200"
							>
								URL: {currentUrl.length > 20 ? currentUrl.substring(0, 20) + '...' : currentUrl} ×
							</Badge>
						{/each}
					{/if}
				</div>
			</div>
		{/if}
	</svelte:boundary>
</div>

<svelte:boundary>
	{#snippet failed(error, reset)}
		<button onclick={reset}>oops! try again</button>
		<pre>{JSON.stringify(error, null, 2)}</pre>
	{/snippet}
	<!-- Results Info and Pagination -->
	<div class="mb-4 flex items-center justify-between">
		<p class="text-sm text-gray-600 dark:text-gray-400">
			Showing {Math.min(filter.offset + 1, logs.logCount)}-{Math.min(
				filter.offset + filter.limit,
				logs.logCount
			)} of {logs.logCount} logs
		</p>
		<PaginationNav
			{currentPage}
			{totalPages}
			onPageChange={(newPage) => {
				filter.offset = (newPage - 1) * filter.limit;
			}}
		/>
	</div>
</svelte:boundary>

<svelte:boundary>
	{#snippet failed(error, reset)}
		<button onclick={reset}>oops! try again</button>
		<pre>{JSON.stringify(error, null, 2)}</pre>
	{/snippet}
	<!-- Logs Table -->
	<div class="overflow-x-auto">
		<Table hoverable={true} striped={true}>
			<TableHead>
				<TableHeadCell class="w-12"></TableHeadCell>
				<TableHeadCell>ID</TableHeadCell>
				<TableHeadCell>Timestamp</TableHeadCell>
				<TableHeadCell>Title</TableHeadCell>
				<TableHeadCell>Context</TableHeadCell>
				<TableHeadCell>Request</TableHeadCell>
				<TableHeadCell>User</TableHeadCell>
				<TableHeadCell>Route</TableHeadCell>
				<TableHeadCell>Domain</TableHeadCell>
				<TableHeadCell>Code</TableHeadCell>
				<TableHeadCell>Action</TableHeadCell>
				<TableHeadCell>Level</TableHeadCell>
				<TableHeadCell>Data</TableHeadCell>
			</TableHead>
			<TableBody>
				{#each logs.logs as log (log.id)}
					<TableBodyRow>
						<TableBodyCell class="text-center">
							<Button
								size="xs"
								color="light"
								onclick={() => openLogModal(log)}
								class="p-1"
								title="View full log details"
							>
								<EyeOutline class="h-3 w-3" />
							</Button>
						</TableBodyCell>
						<TableBodyCell class="font-mono text-sm">{log.id}</TableBodyCell>
						<TableBodyCell class="font-mono text-sm whitespace-nowrap">
							{log.date.toISOString()}
						</TableBodyCell>
						<TableBodyCell class="max-w-xs">
							<div class="truncate" title={log.title}>
								{@html highlightText(log.title, filter.text)}
							</div>
						</TableBodyCell>
						<TableBodyCell>
							{#if log.contextId}
								<Badge
									color="purple"
									onclick={() => {
										log.contextId && toggleItem('contextId', log.contextId);
									}}
									class="cursor-pointer hover:bg-purple-200"
									title="Global Context ID"
								>
									{log.contextId?.substring(0, 8)}...
								</Badge>
							{:else}
								<span class="text-gray-400">-</span>
							{/if}
						</TableBodyCell>
						<TableBodyCell>
							{#if log.requestId}
								<Badge
									color="cyan"
									class="cursor-pointer text-xs hover:bg-cyan-200"
									title="Request ID: {log.requestId}"
									onclick={() => {
										toggleItem('requestId', log.requestId);
									}}
								>
									{log.requestId?.substring(0, 8)}...
								</Badge>
							{:else}
								<span class="text-gray-400">-</span>
							{/if}
						</TableBodyCell>
						<TableBodyCell>
							{#if log.userId}
								<Badge
									color="orange"
									class="cursor-pointer text-xs hover:bg-orange-200"
									title="User ID: {log.userId}"
									onclick={() => {
										toggleItem('userId', log.userId);
									}}
								>
									{log.userId}
								</Badge>
							{:else}
								<span class="text-gray-400">-</span>
							{/if}
						</TableBodyCell>
						<TableBodyCell>
							{#if log.routeId}
								<Badge
									color="pink"
									class="cursor-pointer text-xs hover:bg-pink-200"
									title="Route: {log.routeId}"
									onclick={() => {
										toggleItem('routeId', log.routeId);
									}}
								>
									{log.routeId}
								</Badge>
								{#if log.method && log.url}
									<button
										class="mt-1 cursor-pointer text-xs text-gray-500 hover:text-gray-700"
										title="{log.method} {log.url} - Click to filter by URL"
										onclick={() => {
											log.url && toggleItem('url', log.url);
										}}
									>
										{log.method}
										{log.url?.length > 20 ? log.url.substring(0, 20) + '...' : log.url}
									</button>
								{/if}
							{:else}
								<span class="text-gray-400">-</span>
							{/if}
						</TableBodyCell>
						<TableBodyCell>
							{#if log.domain}
								<Badge
									color="green"
									onclick={() => {
										toggleItem('domain', log.domain);
									}}
									class="cursor-pointer hover:bg-green-200"
								>
									{log.domain}
								</Badge>
							{:else}
								<span class="text-gray-400">-</span>
							{/if}
						</TableBodyCell>
						<TableBodyCell>
							{#if log.code}
								<Badge
									color="indigo"
									onclick={() => {
										toggleItem('code', log.code);
									}}
									class="cursor-pointer hover:bg-indigo-200"
								>
									{log.code}
								</Badge>
							{:else}
								<span class="text-gray-400">-</span>
							{/if}
						</TableBodyCell>
						<TableBodyCell>
							{#if log.action}
								<Badge
									color="blue"
									onclick={() => {
										toggleItem('action', log.action);
									}}
									class="cursor-pointer hover:bg-blue-200"
								>
									{log.action}
								</Badge>
							{:else}
								<span class="text-gray-400">-</span>
							{/if}
						</TableBodyCell>
						<TableBodyCell>
							{#if log.logLevel}
								<Badge
									color={getLevelColor(log.logLevel)}
									onclick={() => {
										toggleItem('level', log.logLevel);
									}}
									class="cursor-pointer font-mono"
								>
									{log.logLevel}
								</Badge>
							{:else}
								<span class="text-gray-400">-</span>
							{/if}
						</TableBodyCell>
						<TableBodyCell class="max-w-md">
							{#if log.dataProcessed}
								<details class="cursor-pointer">
									<summary class="text-sm text-blue-600 hover:text-blue-800">View data</summary>
									<pre
										class="mt-2 max-h-40 overflow-auto rounded bg-gray-100 p-2 text-xs dark:bg-gray-800">{@html highlightText(
											JSON.stringify(log.dataProcessed, null, 2),
											filter.text
										)}</pre>
								</details>
							{:else}
								<div class="text-xs text-gray-400">No data available</div>
							{/if}
						</TableBodyCell>
					</TableBodyRow>
				{/each}
			</TableBody>
		</Table>
	</div>
</svelte:boundary>

<svelte:boundary>
	{#snippet failed(error, reset)}
		<button onclick={reset}>oops! try again</button>
		<pre>{JSON.stringify(error, null, 2)}</pre>
	{/snippet}
	<!-- Bottom Pagination -->
	{#if totalPages > 1}
		<div class="mt-6 flex justify-center">
			<PaginationNav
				{currentPage}
				{totalPages}
				onPageChange={(newPage) => {
					filter.offset = (newPage - 1) * filter.limit;
				}}
			/>
		</div>
	{/if}
</svelte:boundary>

<svelte:boundary>
	{#snippet failed(error, reset)}
		<button onclick={reset}>oops! try again</button>
		<pre>{JSON.stringify(error, null, 2)}</pre>
	{/snippet}
	<!-- Full Log Object Modal -->
	<Modal bind:open={showModal} size="xl" title="Full Log Object Details">
		{#if selectedLog}
			<div class="space-y-4">
				<!-- Log Summary -->
				<div class="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
					<h3 class="mb-2 text-lg font-semibold text-gray-900 dark:text-white">Log Summary</h3>
					<div class="grid grid-cols-2 gap-4 text-sm">
						<div>
							<span class="font-medium text-gray-700 dark:text-gray-300">ID:</span>
							<span class="font-mono">{(selectedLog as any).id || 'N/A'}</span>
						</div>
						<div>
							<span class="font-medium text-gray-700 dark:text-gray-300">Date:</span>
							<span class="font-mono">{selectedLog.date.toISOString()}</span>
						</div>
						<div>
							<span class="font-medium text-gray-700 dark:text-gray-300">Level:</span>
							{#if selectedLog.logLevel}
								<Badge color={getLevelColor(selectedLog.logLevel)} class="font-mono">
									{selectedLog.logLevel}
								</Badge>
							{:else}
								<span class="text-gray-400">N/A</span>
							{/if}
						</div>
						<div>
							<span class="font-medium text-gray-700 dark:text-gray-300">Domain:</span>
							<span>{selectedLog.domain || 'N/A'}</span>
						</div>
						<div>
							<span class="font-medium text-gray-700 dark:text-gray-300">Context ID:</span>
							<span class="font-mono text-xs">{(selectedLog as any).contextId || 'N/A'}</span>
						</div>
						<div>
							<span class="font-medium text-gray-700 dark:text-gray-300">Request ID:</span>
							<span class="font-mono text-xs">{(selectedLog as any).requestId || 'N/A'}</span>
						</div>
						<div>
							<span class="font-medium text-gray-700 dark:text-gray-300">User ID:</span>
							<span class="font-mono text-xs">{(selectedLog as any).userId || 'N/A'}</span>
						</div>
						<div>
							<span class="font-medium text-gray-700 dark:text-gray-300">Route:</span>
							<span class="font-mono text-xs">{(selectedLog as any).routeId || 'N/A'}</span>
						</div>
						{#if (selectedLog as any).method || (selectedLog as any).url}
							<div class="col-span-2">
								<span class="font-medium text-gray-700 dark:text-gray-300">Request:</span>
								<span class="font-mono text-xs">
									{(selectedLog as any).method || ''}
									{(selectedLog as any).url || ''}
								</span>
							</div>
						{/if}
						{#if (selectedLog as any).userAgent}
							<div class="col-span-2">
								<span class="font-medium text-gray-700 dark:text-gray-300">User Agent:</span>
								<span class="text-xs break-all">{(selectedLog as any).userAgent}</span>
							</div>
						{/if}
						{#if (selectedLog as any).ip}
							<div>
								<span class="font-medium text-gray-700 dark:text-gray-300">IP:</span>
								<span class="font-mono text-xs">{(selectedLog as any).ip}</span>
							</div>
						{/if}
						<div class="col-span-2">
							<span class="font-medium text-gray-700 dark:text-gray-300">Title:</span>
							<span>{selectedLog.title}</span>
						</div>
					</div>
				</div>

				<!-- Full Object JSON -->
				<div>
					<h3 class="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
						Complete Object Structure
					</h3>
					<div class="max-h-96 overflow-auto rounded-lg bg-gray-100 p-4 dark:bg-gray-800">
						<pre
							class="text-xs whitespace-pre-wrap text-gray-900 dark:text-gray-100">{JSON.stringify(
								selectedLog,
								null,
								2
							)}</pre>
					</div>
				</div>
			</div>
		{/if}

		{#snippet footer()}
			<Button color="alternative" onclick={() => (showModal = false)}>Close</Button>
			{#if selectedLog}
				<Button
					color="blue"
					onclick={() => {
						navigator.clipboard.writeText(JSON.stringify(selectedLog, null, 2));
					}}
				>
					Copy to Clipboard
				</Button>
			{/if}
		{/snippet}
	</Modal>
</svelte:boundary>
