<script lang="ts">
	import { Button, Modal, Spinner } from 'flowbite-svelte';
	import type { RecommendationType } from '$lib/server/db/actions/journalMaterializedViewActions';
	import type { JournalViewReturnType } from '$lib/server/db/postgres/schema';
	import IdeaIcon from './icons/IdeaIcon.svelte';
	import RecommendationDisplay from './RecommendationDisplay.svelte';
	import {
		journalFilterSchemaWithoutPagination,
		updateJournalSchema
	} from '$lib/schema/journalSchema';
	import { superForm } from 'sveltekit-superforms';
	import { tick } from 'svelte';
	import { z } from 'zod';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { urlGenerator } from '$lib/routes';
	import { goto } from '$app/navigation';

	const {
		recommendations,
		journal
	}: {
		recommendations: Record<string, Promise<RecommendationType[] | undefined>>;
		journal: JournalViewReturnType;
	} = $props();

	let loadingUpdate = $state<string | undefined>();
	let loadingUpdateAndSave = $state<string | undefined>();

	let open = $state(false);

	const journalRecommendations = $derived(recommendations[journal.id]);

	const form = superForm(
		{},
		{
			validators: zodClient(
				updateJournalSchema.merge(z.object({ filter: journalFilterSchemaWithoutPagination }))
			),
			onResult: ({ result }) => {
				if (result.type === 'success') {
					open = false;
				} else {
					loadingUpdate = undefined;
					loadingUpdateAndSave = undefined;
				}
			},
			dataType: 'json'
		}
	);

	const enhance = $derived(form.enhance);
	const formData = $derived(form.form);

	const updateAndEdit = async (rec: RecommendationType) => {
		loadingUpdate = rec.journalId;
		await submitJournalUpdateForm(rec);
		const targetUrl = urlGenerator({
			address: '/(loggedIn)/journals/bulkEdit',
			searchParamsValue: {
				idArray: [journal.id],
				orderBy: [{ field: 'date', direction: 'asc' }],
				page: 0,
				pageSize: 10
			}
		});
		await goto(targetUrl.url);
		loadingUpdate = undefined;
	};

	const updateAndSave = async (rec: RecommendationType) => {
		loadingUpdateAndSave = rec.journalId;

		console.log('Updating and saving journal with recommendation:', rec);

		await submitJournalUpdateForm(rec);
		open = false;
		loadingUpdateAndSave = undefined;
	};

	const submitJournalUpdateForm = async (rec: RecommendationType) => {
		formData.set({
			filter: {
				idArray: [journal.id]
			},
			otherAccountId: rec.payeeAccountId,
			description: rec.journalDescription,
			billId: rec.journalBillId,
			budgetId: rec.journalBudgetId,
			categoryId: rec.journalCategoryId,
			tagId: rec.journalTagId,
			clearDataChecked: false,
			setDataChecked: true
		});
		await tick();
		form.submit();
	};
</script>

{#await journalRecommendations}
	<Button on:click={() => (open = true)} class="p-2">
		<Spinner size="4" />
	</Button>
{:then rec}
	{@const enabled = rec && rec.length > 0}

	<Button
		on:click={() => enabled && (open = true)}
		disabled={!enabled}
		class="relative p-2"
		color={enabled ? 'red' : undefined}
	>
		<IdeaIcon />
	</Button>
{/await}

<Modal title="Recommendation" bind:open outsideclose size="xl">
	<form action="?/updateJournal" method="post" use:enhance></form>
	<RecommendationDisplay
		recommendations={journalRecommendations}
		{updateAndSave}
		update={updateAndEdit}
		hideHeading
		{journal}
		{loadingUpdate}
		{loadingUpdateAndSave}
	/>
</Modal>
