<script lang="ts">
	import { Button, Indicator, Modal, Spinner, type ButtonColorType } from 'flowbite-svelte';
	import type { RecommendationType } from '$lib/server/db/actions/journalMaterializedViewActions';
	import type { JournalViewReturnType } from '$lib/server/db/postgres/schema';
	import IdeaIcon from './icons/IdeaIcon.svelte';

	const {
		recommendations,
		journal
	}: {
		recommendations: Record<string, Promise<RecommendationType[] | undefined>>;
		journal: JournalViewReturnType;
	} = $props();

	let open = $state(false);

	const journalRecommendations = $derived(recommendations[journal.id]);
</script>

{#await journalRecommendations}
	<Button on:click={() => (open = true)} class="p-2">
		<Spinner size="4" />
	</Button>
{:then rec}
	{@const enabled = rec && rec.length > 0}

	<Button
		on:click={() => (open = true)}
		disabled={!enabled}
		class="relative p-2"
		color={enabled ? 'red' : undefined}
	>
		<IdeaIcon />
	</Button>
{/await}
