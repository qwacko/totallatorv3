<script lang="ts">
	import type { TransactionHistoryItemType } from '@totallator/business-logic';
	import { Spinner } from 'flowbite-svelte';

	import TransactionHistoryDisplay from './TransactionHistoryDisplay.svelte';
	import { getTransactionHistory } from './transactionHistory.remote';

	const { transactionId }: { transactionId: string } = $props();

	const history = $derived(await getTransactionHistory({ transactionId }));
</script>

<svelte:boundary>
	{#if history && Array.isArray(history)}
		{#if history.length === 0}
			<div class="py-4 text-sm text-gray-500">No history recorded yet.</div>
		{:else}
			<div class="flex max-h-[60vh] flex-col gap-3 overflow-y-auto pr-1">
				{#each history as item}
					<TransactionHistoryDisplay item={item as TransactionHistoryItemType} />
				{/each}
			</div>
		{/if}
	{:else}
		<div class="flex items-center gap-2 py-4 text-sm text-gray-500">
			<Spinner size="4" />
			Loading history
		</div>
	{/if}
	{#snippet failed(error, reset)}
		<div class="flex flex-col gap-2 py-4 text-sm text-red-600">
			<div>Failed to load history.</div>
			<button class="underline" onclick={reset}>Retry</button>
			<pre class="overflow-auto text-xs">{JSON.stringify(error, null, 2)}</pre>
		</div>
	{/snippet}
</svelte:boundary>
