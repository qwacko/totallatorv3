<script lang="ts">
	import RecommendationCore from './RecommendationCore.svelte';
	import { recommendTagRemote } from './recommendLinks.remote';

	const {
		payeeId,
		currentTagId,
		updateId
	}: { payeeId: string | undefined; currentTagId?: string; updateId: (id: string) => void } =
		$props();
</script>

{#if payeeId}
	<RecommendationCore
		currentId={currentTagId}
		getItems={recommendTagRemote}
		params={{ payee: payeeId }}
		{updateId}
	/>
{/if}
