<script lang="ts">
	import type { RecommendationType } from '$lib/server/db/actions/journalMaterializedViewActions';
	import RecommendationDisplaySingle from './RecommendationDisplaySingle.svelte';

	const { recommendations }: { recommendations: Promise<RecommendationType[] | undefined> } =
		$props();
</script>

{#await recommendations then recs}
	{#if recs}
		<div class="flex w-full flex-col items-stretch gap-1">
			{#each recs as rec}
				<RecommendationDisplaySingle recommendation={rec} />
			{/each}
		</div>
	{/if}
{/await}
