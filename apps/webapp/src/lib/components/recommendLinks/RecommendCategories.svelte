<script lang="ts">
	import RecommendationCore from './RecommendationCore.svelte';
	import { recommendCategoryRemote } from './recommendLinks.remote';

	const {
		payeeId,
		currentCategoryId,
		updateId
	}: { payeeId: string | undefined; currentCategoryId?: string; updateId: (id: string) => void } =
		$props();
</script>

{#if payeeId}
	<RecommendationCore
		currentId={currentCategoryId}
		getItems={recommendCategoryRemote}
		params={{ payee: payeeId }}
		{updateId}
		key="recommend-categories"
	/>
{/if}
