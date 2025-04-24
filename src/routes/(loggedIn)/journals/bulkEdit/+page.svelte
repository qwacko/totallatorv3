<script lang="ts">
	import PageLayout from '$lib/components/PageLayout.svelte';
	import { Button, Heading } from 'flowbite-svelte';
	import BulkEditState from './BulkEditState.svelte';
	import { page } from '$app/stores';
	import { pageInfo } from '$lib/routes';
	import { superForm } from 'sveltekit-superforms';
	import { updateJournalSchema } from '$lib/schema/journalSchema';
	import ErrorText from '$lib/components/ErrorText.svelte';
	import PreviousUrlInput from '$lib/components/PreviousURLInput.svelte';
	import UpdateJournalForm from '../clone/UpdateJournalForm.svelte';
	import UpdateJournalLinksForm from '../clone/UpdateJournalLinksForm.svelte';
	import PrevPageButton from '$lib/components/PrevPageButton.svelte';
	import FilterTextDisplay from '$lib/components/FilterTextDisplay.svelte';
	import UpdateJournalLabelsForm from '../clone/UpdateJournalLabelsForm.svelte';
	import CustomHeader from '$lib/components/CustomHeader.svelte';
	import RawDataModal from '$lib/components/RawDataModal.svelte';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import RecommendationDisplay from '$lib/components/RecommendationDisplay.svelte';
	import type { RecommendationType } from '$lib/server/db/actions/journalMaterializedViewActions';
	import { tick } from 'svelte';

	const { data } = $props();

	const urlInfo = $derived(pageInfo('/(loggedIn)/journals/bulkEdit', $page));

	const form = superForm(data.form, {
		validators: zodClient(updateJournalSchema),
		onError: () => {
			loadingUpdate = undefined;
			loadingUpdateAndSave = undefined;
		}
	});

	const enhance = $derived(form.enhance);
	const formData = $derived(form.form);

	const titleText = $derived(
		data.journals.count === 1 ? 'Edit Journal' : `Bulk Edit ${data.journals.count} Journals`
	);

	let loadingUpdate = $state<string | undefined>();
	let loadingUpdateAndSave = $state<string | undefined>();

	const updateFromRecommendation = async (rec: RecommendationType) => {
		loadingUpdate = rec.journalId;

		$formData = {
			...$formData,
			billId: rec.journalBillId,
			tagId: rec.journalTagId,
			budgetId: rec.journalBudgetId,
			categoryId: rec.journalCategoryId,
			otherAccountId: rec.payeeAccountId,
			description: rec.journalDescription
		};

		loadingUpdate = undefined;
	};

	const updateAndSaveFromRecommendation = async (rec: RecommendationType) => {
		loadingUpdateAndSave = rec.journalId;
		updateFromRecommendation(rec);
		await tick();
		form.submit();
		loadingUpdateAndSave = undefined;
	};
</script>

<CustomHeader pageTitle={titleText} filterText={data.filterText} />

<PageLayout title={titleText}>
	<FilterTextDisplay text={data.filterText} />
	<Heading tag="h3">Set Journal State</Heading>
	<RawDataModal data={$formData} dev={data.dev} />
	<BulkEditState
		currentPage={urlInfo.current.url}
		filter={urlInfo.current.searchParams}
		complete={data.selectedJournals.complete}
		reconciled={data.selectedJournals.reconciled}
		dataChecked={data.selectedJournals.dataChecked}
		canEdit={data.selectedJournals.canEdit}
	/>
	<Heading tag="h3">Update Data</Heading>
	{#if !$formData.setDataChecked}
		<RecommendationDisplay
			recommendations={data.recommendations}
			update={updateFromRecommendation}
			updateAndSave={updateAndSaveFromRecommendation}
			{loadingUpdate}
			{loadingUpdateAndSave}
		/>
	{/if}

	{#if !data.selectedJournals.canEdit}<ErrorText
			message="At Least One Journal Is Complete So Can Only Update Journal Labels"
			title="Complete Journals Present"
		/>{/if}
	<form method="post" class="grid grid-cols-1 gap-2 md:grid-cols-2" action="?/update" use:enhance>
		<PreviousUrlInput name="prevPage" />
		<input type="hidden" name="filter" value={JSON.stringify(urlInfo.current.searchParams)} />
		<input type="hidden" name="currentPage" value={urlInfo.current.url} />
		{#if data.selectedJournals.canEdit}
			<UpdateJournalForm {form} />
			<UpdateJournalLinksForm {form} />
		{/if}
		<UpdateJournalLabelsForm
			{form}
			allLabelIds={data.allLabelIds}
			commonLabelIds={data.commonLabelIds}
		/>
		<Button type="submit">Update {data.journals.count} Journals</Button>
		<Button on:click={() => form.reset()}>Reset</Button>
		<PrevPageButton>Cancel</PrevPageButton>
	</form>
</PageLayout>
