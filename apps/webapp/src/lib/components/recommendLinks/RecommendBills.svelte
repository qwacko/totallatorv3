<script lang="ts">
	import RecommendationCore from './RecommendationCore.svelte';
	import { recommendBillRemote } from './recommendLinks.remote';

	const {
		payeeId,
		currentBillId,
		updateId
	}: { payeeId: string | undefined; currentBillId?: string; updateId: (id: string) => void } =
		$props();
</script>

{#if payeeId}
	<RecommendationCore
		currentId={currentBillId}
		getItems={recommendBillRemote}
		params={{ payee: payeeId }}
		{updateId}
		key="recommend-bills"
	/>
{/if}
