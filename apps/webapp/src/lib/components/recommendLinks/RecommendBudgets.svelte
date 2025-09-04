<script lang="ts">
	import RecommendationCore from './RecommendationCore.svelte';
	import { recommendBudgetRemote } from './recommendLinks.remote';

	const {
		payeeId,
		currentBudgetId,
		updateId
	}: { payeeId: string | undefined; currentBudgetId?: string; updateId: (id: string) => void } =
		$props();
</script>

{#if payeeId}
	<RecommendationCore
		currentId={currentBudgetId}
		getItems={recommendBudgetRemote}
		params={{ payee: payeeId }}
		{updateId}
		key="recommend-budgets"
	/>
{/if}
