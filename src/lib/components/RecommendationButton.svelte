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

	const {
		recommendations,
		journal
	}: {
		recommendations: Record<string, Promise<RecommendationType[] | undefined>>;
		journal: JournalViewReturnType;
	} = $props();

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
				}
			},
			dataType: 'json'
		}
	);

	const enhance = $derived(form.enhance);
	const formData = $derived(form.form);

	// form.submit();

	const updateAndSave = async (rec: RecommendationType) => {
		console.log('Updating and saving journal with recommendation:', rec);
		// await submitJournalUpdateForm({
		// 	filter: {
		// 		idArray: [journal.id]
		// 	},
		// 	otherAccountId: rec.payeeAccountId,
		// 	description: rec.journalDescription,
		// 	billId: rec.journalBillId,
		// 	budgetId: rec.journalBudgetId,
		// 	categoryId: rec.journalCategoryId,
		// 	tagId: rec.journalTagId,
		// 	clearDataChecked: false,
		// 	setDataChecked: true
		// });

		await submitJournalUpdateForm(rec);

		// if (!response.ok) {
		// 	console.error('Error updating journal:', await response.json());
		// 	return;
		// }
		// console.log('Journal updated successfully:', await response.json());
		open = false;
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

		// const endpoint = '/journals/bulkEdit?/update';

		// const formDataObj = {
		// 	filter: {
		// 		idArray: [journal.id]
		// 	},
		// 	prevPage: $pageStore.prevURL,
		// 	currentPage: $pageStore.currentURL,
		// 	billId: data.billId,
		// 	budgetId: data.budgetId,
		// 	categoryId: data.categoryId,
		// 	tagId: data.tagId
		// };

		// const formData = new FormData();
		// formData.append('filter', JSON.stringify({ idArray: [journal.id] }));
		// formData.append('prevPage', $pageStore.prevURL);
		// formData.append('currentPage', $pageStore.currentURL);
		// if (data.billId) formData.append('billId', data.billId);
		// if (data.budgetId) formData.append('budgetId', data.budgetId);
		// if (data.categoryId) formData.append('categoryId', data.categoryId);
		// if (data.tagId) formData.append('tagId', data.tagId);
		// if (data.description) formData.append('description', data.description);

		// const result = await fetch(endpoint, {
		// 	method: 'POST',
		// 	body: formData,
		// 	headers: {
		// 		// 'Content-Type': 'application/json',
		// 		'x-sveltekit-action': 'true' // Very Important header for SvelteKit to recognize it as a form action call.
		// 	}
		// });

		// return result;
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
		update={() => (open = false)}
		hideHeading
		{journal}
	/>
</Modal>
