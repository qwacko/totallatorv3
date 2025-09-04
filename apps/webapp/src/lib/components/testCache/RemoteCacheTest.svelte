<script lang="ts">
	import { delayRemote } from '$lib/components/testCache/delayRemote.remote';
	import { remoteCache, remoteCachePersisted } from '$lib/components/testCache/remoteCache.svelte';

	import { CustomPersistedState } from './CustomPersistedState.svelte';

	const { id }: { id: number } = $props();

	const cachedQuery = remoteCache(delayRemote, () => ({ test: `group-${id}` }));
	const persistedQueryCache = remoteCachePersisted(delayRemote, () => ({ test: `group-${id}` }), {
		storage: 'local'
	});

	const persistedCount = new CustomPersistedState('count', 0, {
		storage: 'local',
		syncTabs: true
	});
</script>

<div class="flex flex-row items-center gap-2">
	<span class="font-bold">Group {id}:</span>
	<div class="flex w-96 flex-row gap-2">
		{#if cachedQuery.value.loading}
			<div class="w-96 animate-pulse">Loading...</div>
		{:else if cachedQuery.value.error}
			<div class="w-96 text-red-500">Error: {cachedQuery.value.error.message}</div>
		{:else}
			<div class="flex w-96" class:text-gray-500={cachedQuery.value.refreshing}>
				<pre>{JSON.stringify(cachedQuery.value.value, null, 2)}</pre>
			</div>
		{/if}

		<button
			onclick={cachedQuery.value.refresh}
			disabled={cachedQuery.value.loading}
			class="rounded bg-blue-500 px-2 py-1 text-white disabled:opacity-50"
		>
			Refresh
		</button>
	</div>
	<div class="flex w-96 flex-row gap-2">
		{#if persistedQueryCache.error}
			<div class="w-96 text-red-500">Error: {persistedQueryCache.error.message}</div>
		{:else if persistedQueryCache.loading}
			<div class="w-96 animate-pulse">Loading...</div>
		{:else}
			<div class="flex w-96" class:text-gray-500={persistedQueryCache.refreshing}>
				<pre>{JSON.stringify(persistedQueryCache.value.current, null, 2)}</pre>
			</div>
		{/if}

		<button
			onclick={persistedQueryCache.refresh}
			disabled={persistedQueryCache.loading}
			class="rounded bg-blue-500 px-2 py-1 text-white disabled:opacity-50"
		>
			Refresh
		</button>
		<button onclick={() => persistedQueryCache.setValue({ test: 'Hello', time: new Date() })}>
			Set Value
		</button>
	</div>
</div>
<div class="flex">
	<button onclick={() => persistedCount.current !== undefined && persistedCount.current++}>
		Increment
	</button>
	<button onclick={() => persistedCount.current !== undefined && persistedCount.current--}>
		Decrement
	</button>
	<button onclick={() => (persistedCount.current = 0)}>Reset</button>
	<p>Count: {persistedCount.current}</p>
</div>
