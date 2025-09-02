<script lang="ts">
	import { delayRemote } from '$lib/components/testCache/delayRemote.remote';
	import { remoteCache } from '$lib/components/testCache/remoteCache.svelte';

	const { id }: { id: number } = $props();

	const cachedQuery = remoteCache(delayRemote, () => ({ test: `group-${id}` }));
</script>

<div class="flex flex-row items-center gap-2">
	<span class="font-bold">Group {id}:</span>

	{#if cachedQuery.value.loading}
		<div class="w-96 animate-pulse">Loading...</div>
	{:else if cachedQuery.value.error}
		<div class="w-96 text-red-500">Error: {cachedQuery.value.error.message}</div>
	{:else}
		<div class="flex w-96">
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
