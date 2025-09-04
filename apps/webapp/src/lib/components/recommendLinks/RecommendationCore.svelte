<script lang="ts" generics="ParamType extends any">
	import type { RemoteQueryFunction } from '@sveltejs/kit';
	import { Button } from 'flowbite-svelte';
	import { untrack } from 'svelte';

	import LoadingSpinner from '../LoadingSpinner.svelte';
	import { remoteCachePersisted } from '../testCache/remoteCache.svelte';

	type ReturnType = {
		recommendations: {
			id: string;
			title: string;
			count: number;
			fraction: number;
		}[];
	};

	const {
		params,
		getItems,
		currentId,
		updateId,
		key
	}: {
		params: ParamType;
		getItems: RemoteQueryFunction<ParamType, ReturnType>;
		currentId?: string;
		updateId: (id: string) => void;
		key: string;
	} = $props();

	let delayedParams = $state<ParamType | undefined>(undefined);

	let timeout = $state<NodeJS.Timeout | undefined>(undefined);

	$effect(() => {
		params;
		untrack(() => {
			clearTimeout(timeout);

			timeout = setTimeout(() => {
				delayedParams = params;
			}, 5);
		});
	});

	const result = remoteCachePersisted(getItems, () => delayedParams, {
		storage: 'indexeddb',
		syncTabs: true,
		key
	});
</script>

{#if currentId === undefined && delayedParams !== undefined}
	{#if result.loading}
		<LoadingSpinner loadingText="Loading Recommendations" />
	{:else if result.error}{:else if result.value.current}
		{@const maxFraction = Math.max(...result.value.current.recommendations.map((r) => r.fraction))}
		<div class="@md:grid-cols-2 grid grid-cols-1 gap-2 self-stretch">
			{#each result.value.current.recommendations as data}
				<Button
					class="relative justify-start overflow-hidden text-left"
					color="alternative"
					onclick={() => updateId(data.id)}
				>
					<div
						class="absolute inset-0 bg-blue-100 opacity-30 transition-all duration-200 dark:bg-blue-900"
						style="width: {(data.fraction / maxFraction) * 100}%"
					></div>
					<div class="relative z-10 flex w-full items-center justify-between">
						<span class="truncate">{data.title}</span>
						<span class="ml-2 shrink-0 text-xs font-medium">
							{(data.fraction * 100).toFixed(0)}%
						</span>
					</div>
				</Button>
			{/each}
		</div>
	{/if}
{/if}
