<script lang="ts">
	import type { TransactionHistoryItemType } from '@totallator/business-logic';
	import { defaultAllJournalFilter } from '@totallator/shared';
	import { Badge, Button, Spinner } from 'flowbite-svelte';

	import TransactionHistoryDisplay from '$lib/components/associatedInfo/TransactionHistoryDisplay.svelte';
	import JournalEntryIcon from '$lib/components/icons/JournalEntryIcon.svelte';
	import { urlGenerator } from '$lib/routes';

	import { getFilterTransactionHistory } from './filterHistory.remote';

	const { filterId }: { filterId: string } = $props();

	const history = $derived(await getFilterTransactionHistory({ filterId }));
	const createCount = $derived(
		Array.isArray(history) ? history.filter((item) => item.changeType === 'create').length : 0
	);
	const updateCount = $derived(
		Array.isArray(history) ? history.filter((item) => item.changeType === 'update').length : 0
	);
	const deleteCount = $derived(
		Array.isArray(history) ? history.filter((item) => item.changeType === 'delete').length : 0
	);
</script>

<svelte:boundary>
	{#if history && Array.isArray(history)}
		<div class="mb-3 flex flex-wrap items-center gap-2">
			<Button
				href={urlGenerator({
					address: '/(loggedIn)/journals',
					searchParamsValue: {
						...defaultAllJournalFilter(),
						filterIdArray: [filterId]
					}
				}).url}
				outline
				color="light"
				size="sm"
			>
				<JournalEntryIcon />
				View impacted journals
			</Button>
			{#if history.length > 0}
				<Badge color="blue">Related Changes: {history.length}</Badge>
				{#if createCount > 0}
					<Badge color="green">Created: {createCount}</Badge>
				{/if}
				{#if updateCount > 0}
					<Badge color="yellow">Updated: {updateCount}</Badge>
				{/if}
				{#if deleteCount > 0}
					<Badge color="red">Deleted: {deleteCount}</Badge>
				{/if}
			{/if}
		</div>
		{#if history.length === 0}
			<div class="py-4 text-sm text-gray-500">No related changes recorded for this reusable filter.</div>
		{:else}
			<div class="flex max-h-[65vh] flex-col gap-3 overflow-y-auto pr-1">
				{#each history as item}
					<TransactionHistoryDisplay item={item as TransactionHistoryItemType} />
				{/each}
			</div>
		{/if}
	{:else}
		<div class="flex items-center gap-2 py-4 text-sm text-gray-500">
			<Spinner size="4" />
			Loading related changes
		</div>
	{/if}
	{#snippet failed(error, reset)}
		<div class="flex flex-col gap-2 py-4 text-sm text-red-600">
			<div>Failed to load related changes.</div>
			<button class="underline" onclick={reset}>Retry</button>
			<pre class="overflow-auto text-xs">{JSON.stringify(error, null, 2)}</pre>
		</div>
	{/snippet}
</svelte:boundary>
