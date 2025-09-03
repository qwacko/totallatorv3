<script lang="ts">
	import RecommendationCore from './../recommendLinks/RecommendationCore.svelte';
	import { recommendTextFromAccount } from './recommendText.remote';

	const {
		payeeId,
		updateText
	}: { payeeId: string | undefined; currentTagId?: string; updateText: (text: string) => void } =
		$props();
</script>

{#if payeeId}
	<RecommendationCore
		currentId={undefined}
		getItems={recommendTextFromAccount}
		params={{ payeeId: payeeId }}
		updateId={(text) => updateText(text)}
	/>
{/if}
