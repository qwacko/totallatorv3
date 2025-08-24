<script lang="ts">
	import { Button } from 'flowbite-svelte';

	import type { AssociatedInfoDataType } from '@totallator/business-logic';
	import { formatDate } from '@totallator/shared';

	import { enhance } from '$app/forms';

	import DeleteIcon from '$lib/components/icons/DeleteIcon.svelte';
	import { userInfoStore } from '$lib/stores/userInfoStore';

	import DisplayCurrency from '../DisplayCurrency.svelte';

	const { summary }: { summary: AssociatedInfoDataType['journalSnapshots'][number] } = $props();

	let expanded = $state<boolean>(false);
</script>

{#snippet displayTextItem(title: string, text: string)}
	<div class="flex">
		{title}{text}
	</div>
{/snippet}

{#snippet displayCurrencyItem(text: string, value: number)}
	<div class="flex">
		{text}
		<DisplayCurrency amount={value} />
	</div>
{/snippet}

<div class="flex flex-col gap-2">
	<div class="flex flex-row items-center gap-2">
		<div class="flex">
			Journal Summary! ({formatDate(summary.earliest, $userInfoStore.dateFormat)} - {formatDate(
				summary.latest,
				$userInfoStore.dateFormat
			)})
		</div>
		<form method="post" action="?/deleteSummary" use:enhance>
			<input type="hidden" name="summaryId" value={summary.id} />
			<Button type="submit" outline color="red" class="rounded-lg border-1 p-1">
				<DeleteIcon />
			</Button>
		</form>
	</div>
	<div class="flex flex-row items-center gap-2">
		{@render displayCurrencyItem('Sum : ', summary.sum)}
		{@render displayTextItem('Count : ', summary.count.toFixed(0))}
	</div>
	{#if expanded}
		<div class="flex flex-row items-center gap-2">
			{@render displayCurrencyItem('Average : ', summary.average)}
		</div>
		<div class="flex flex-row items-center gap-2">
			{@render displayCurrencyItem('Positive Sum : ', summary.positiveSum)}
			{@render displayTextItem('Positive Count : ', summary.positiveCount.toFixed(0))}
		</div>
		<div class="flex flex-row items-center gap-2">
			{@render displayCurrencyItem('Negative Sum : ', summary.negativeSum)}
			{@render displayTextItem('Negative Count : ', summary.negativeCount.toFixed(0))}
		</div>
		<div class="flex flex-row items-center gap-2">
			{@render displayCurrencyItem('Positive Sum (No Transfer) : ', summary.positiveSumNonTransfer)}
			{@render displayTextItem(
				'Positive Count (No Transfer) : ',
				summary.positiveCountNonTransfer.toFixed(0)
			)}
		</div>
		<div class="flex flex-row items-center gap-2">
			{@render displayCurrencyItem('Negative Sum (No Transfer) : ', summary.negativeSumNonTransfer)}
			{@render displayTextItem(
				'Negative Count (No Transfer) : ',
				summary.negativeCountNonTransfer.toFixed(0)
			)}
		</div>
		<Button
			onclick={() => {
				expanded = false;
			}}
			class="rounded-lg"
			outline
		>
			Collapse
		</Button>
	{:else}
		<Button
			onclick={() => {
				expanded = true;
			}}
			class="rounded-lg"
			outline
		>
			Expand
		</Button>
	{/if}
</div>
