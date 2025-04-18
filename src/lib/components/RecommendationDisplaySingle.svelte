<script lang="ts">
	import type { RecommendationType } from '$lib/server/db/actions/journalMaterializedViewActions';
	import { Badge, Card } from 'flowbite-svelte';

	import {
		tagDropdownData,
		billDropdownData,
		budgetDropdownData,
		categoryDropdownData
	} from '$lib/stores/dropdownStores.js';

	const { recommendation }: { recommendation: RecommendationType } = $props();
</script>

{#snippet DisplayItemBadge(id: string, items: { id: string; title: string }[] | undefined)}
	{#if items}
		{@const item = items.find((item) => item.id === id)}
		{#if item}
			<Badge>
				{item.title}
			</Badge>
		{/if}
	{/if}
{/snippet}

<Card size="none">
	<div>
		<p>
			<strong>Check Description:</strong>
			{recommendation.checkDescription}
		</p>
		<p>
			<strong>Search Description:</strong>
			{recommendation.searchDescription}
		</p>
		<p>
			<strong>Common Features:</strong>
			{#if recommendation.checkDescription && recommendation.searchDescription}
				{#each recommendation.checkDescription.split(' ') as word}
					{#if recommendation.searchDescription
						.toLocaleLowerCase()
						.includes(word.toLocaleLowerCase())}
						<strong>{word}</strong>
						{' '}
					{:else}
						{word}{' '}
					{/if}
				{/each}
			{/if}
		</p>
	</div>
	{#if recommendation.journalTagId}
		{@render DisplayItemBadge(recommendation.journalTagId, $tagDropdownData)}
	{/if}
	{#if recommendation.journalBillId}
		{@render DisplayItemBadge(recommendation.journalBillId, $billDropdownData)}
	{/if}
	{#if recommendation.journalBudgetId}
		{@render DisplayItemBadge(recommendation.journalBudgetId, $budgetDropdownData)}
	{/if}
	{#if recommendation.journalCategoryId}
		{@render DisplayItemBadge(recommendation.journalCategoryId, $categoryDropdownData)}
	{/if}

	{JSON.stringify(recommendation, null, 2)}
</Card>
"
