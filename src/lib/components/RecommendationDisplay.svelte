<script lang="ts">
	import type { RecommendationType } from '$lib/server/db/actions/journalMaterializedViewActions';
	import { Heading, P } from 'flowbite-svelte';
	import RecommendationDisplaySingle from './RecommendationDisplaySingle.svelte';

	const {
		recommendations,
		update,
		updateAndSave
	}: {
		recommendations: Promise<RecommendationType[] | undefined>;
		update: (rec: RecommendationType) => void;
		updateAndSave: (rec: RecommendationType) => void;
	} = $props();
</script>

{#await recommendations then recs}
	{#if recs}
		<div class="flex flex-col items-stretch gap-1">
			<Heading tag="h4">Recommendations</Heading>

			<div class="flex flex-row gap-1">
				<P>Search Description:</P><P italic>{recs[0].searchDescription}</P>
			</div>

			<div class="grid grid-cols-1 items-stretch gap-2 md:grid-cols-2">
				{#each recs as rec}
					<RecommendationDisplaySingle
						recommendation={rec}
						update={() => update(rec)}
						updateAndSave={() => updateAndSave(rec)}
					/>
				{/each}
			</div>
		</div>
	{/if}
{/await}
