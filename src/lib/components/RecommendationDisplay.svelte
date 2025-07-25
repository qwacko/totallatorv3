<script lang="ts">
	import type { EnhancedRecommendationType } from '$lib/server/services/journalRecommendationService';
	import { Heading, P } from 'flowbite-svelte';
	import RecommendationDisplaySingle from './RecommendationDisplaySingle.svelte';
	import { formatDate, getCurrencyFormatter } from '$lib/schema/userSchema';
	import { currencyFormat, userDateFormat } from '$lib/stores/userInfoStore';
	import type { JournalViewReturnType } from '$lib/server/db/postgres/schema';

	const {
		recommendations,
		update,
		updateAndSave,
		hideHeading,
		journal,
		loadingUpdate,
		loadingUpdateAndSave
	}: {
		hideHeading?: boolean;
		recommendations: Promise<EnhancedRecommendationType[] | undefined>;
		update?: (rec: EnhancedRecommendationType) => void;
		updateAndSave?: (rec: EnhancedRecommendationType) => void;
		journal?: JournalViewReturnType;
		loadingUpdate?: string | undefined;
		loadingUpdateAndSave?: string | undefined;
	} = $props();
</script>

{#await recommendations then recs}
	{#if recs}
		<div class="@container flex flex-col items-stretch gap-1">
			{#if !hideHeading}
				<Heading tag="h4">Recommendations</Heading>
			{/if}

			<div class="flex flex-row gap-1">
				<P>Search Description:</P><P italic>{recs[0].searchDescription}</P>
			</div>
			{#if journal}
				<div class="flex flex-row gap-1">
					<P>Date:</P><P italic>{formatDate(journal.date, $userDateFormat)}</P>
					<P>Amount:</P><P italic>{getCurrencyFormatter($currencyFormat).format(journal.amount)}</P>
				</div>
			{/if}

			<div class="grid grid-cols-1 items-stretch gap-2 @2xl:grid-cols-2">
				{#each recs as rec}
					<RecommendationDisplaySingle
						recommendation={rec}
						update={update ? () => update(rec) : undefined}
						updateAndSave={updateAndSave ? () => updateAndSave(rec) : undefined}
						{loadingUpdate}
						{loadingUpdateAndSave}
					/>
				{/each}
			</div>
		</div>
	{/if}
{/await}
