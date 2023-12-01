<script lang="ts">
	import PageLayout from '$lib/components/PageLayout.svelte';
	import { Button, Heading } from 'flowbite-svelte';
	import BulkEditState from './BulkEditState.svelte';
	import { page } from '$app/stores';
	import { pageInfo } from '$lib/routes';
	import { superForm } from 'sveltekit-superforms/client';
	import {
		updateJournalSchema,
		type UpdateJournalSchemaSuperType
	} from '$lib/schema/journalSchema';
	import ErrorText from '$lib/components/ErrorText.svelte';
	import PreviousUrlInput from '$lib/components/PreviousURLInput.svelte';
	import UpdateJournalForm from '../clone/UpdateJournalForm.svelte';
	import UpdateJournalLinksForm from '../clone/UpdateJournalLinksForm.svelte';
	import PrevPageButton from '$lib/components/PrevPageButton.svelte';
	import FilterTextDisplay from '$lib/components/FilterTextDisplay.svelte';
	import UpdateJournalLabelsForm from '../clone/UpdateJournalLabelsForm.svelte';
	import CustomHeader from '$lib/components/CustomHeader.svelte';
	import RawDataModal from '$lib/components/RawDataModal.svelte';

	export let data;

	$: urlInfo = pageInfo('/(loggedIn)/journals/bulkEdit', $page);

	const form = superForm<UpdateJournalSchemaSuperType>(data.form, {
		taintedMessage: null,
		validators: updateJournalSchema
	});

	$: enhance = form.enhance;
	$: formData = form.form;

	$: titleText =
		data.journals.count === 1 ? 'Edit Journal' : `Bulk Edit ${data.journals.count} Journals`;
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
	{#if !data.selectedJournals.canEdit}<ErrorText
			message="At Least One Journal Is Complete So Cannot Update Journals"
			title="Complete Journals Present"
		/>
	{:else}
		<form method="post" class="grid grid-cols-1 md:grid-cols-2 gap-2" action="?/update" use:enhance>
			<PreviousUrlInput name="prevPage" />
			<input type="hidden" name="filter" value={JSON.stringify(urlInfo.current.searchParams)} />
			<input type="hidden" name="currentPage" value={urlInfo.current.url} />

			<UpdateJournalForm {form} />
			<UpdateJournalLinksForm {form} dropdownInfo={data.streamed.dropdownInfo} />
			<UpdateJournalLabelsForm
				{form}
				dropdownInfo={data.streamed.dropdownInfo}
				allLabelIds={data.allLabelIds}
				commonLabelIds={data.commonLabelIds}
			/>
			<Button type="submit">Update {data.journals.count} Journals</Button>
			<Button on:click={() => form.reset()}>Reset</Button>
			<PrevPageButton>Cancel</PrevPageButton>
		</form>
	{/if}
</PageLayout>
