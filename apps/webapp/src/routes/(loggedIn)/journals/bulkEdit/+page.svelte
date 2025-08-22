<script lang="ts">
	import { Button, Heading } from 'flowbite-svelte';
	import { tick } from 'svelte';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';

	import type { RecommendationType } from '@totallator/business-logic';
	import { updateJournalSchema } from '@totallator/shared';

	import { page } from '$app/state';

	import CustomHeader from '$lib/components/CustomHeader.svelte';
	import ErrorText from '$lib/components/ErrorText.svelte';
	import FilterTextDisplay from '$lib/components/FilterTextDisplay.svelte';
	import PageLayout from '$lib/components/PageLayout.svelte';
	import PreviousUrlInput from '$lib/components/PreviousURLInput.svelte';
	import PrevPageButton from '$lib/components/PrevPageButton.svelte';
	import RawDataModal from '$lib/components/RawDataModal.svelte';
	import RecommendationDisplay from '$lib/components/RecommendationDisplay.svelte';
	import { pageInfo } from '$lib/routes';

	import UpdateJournalForm from '../clone/UpdateJournalForm.svelte';
	import UpdateJournalLabelsForm from '../clone/UpdateJournalLabelsForm.svelte';
	import UpdateJournalLinksForm from '../clone/UpdateJournalLinksForm.svelte';
	import BulkEditState from './BulkEditState.svelte';

	const { data } = $props();

	const urlInfo = pageInfo('/(loggedIn)/journals/bulkEdit', () => page);

	const form = superForm(data.form, {
		validators: zod4Client(updateJournalSchema),
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
			billId: rec.journalBillId || undefined,
			tagId: rec.journalTagId || undefined,
			budgetId: rec.journalBudgetId || undefined,
			categoryId: rec.journalCategoryId || undefined,
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
		currentPage={urlInfo.updateParamsURLGenerator({}).url}
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
		<input type="hidden" name="currentPage" value={urlInfo.updateParamsURLGenerator({}).url} />
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
		<Button onclick={() => form.reset()}>Reset</Button>
		<PrevPageButton>Cancel</PrevPageButton>
	</form>
</PageLayout>
