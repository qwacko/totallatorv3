<script lang="ts">
	import { Button, P } from 'flowbite-svelte';
	import ActionButton from './ActionButton.svelte';
	import type { JournalFilterSchemaType } from '$lib/schema/journalSchema';
	import { superForm } from 'sveltekit-superforms';
	import {
		createNoteJournalSchema,
		type CreateNoteJournalSchemaInputType
	} from '$lib/schema/noteSchema';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { formatDate } from '$lib/schema/userSchema';
	import { userDateFormat } from '$lib/stores/userInfoStore';
	import TextInputForm from './TextInputForm.svelte';
	import type { CreateFileNoteRelationshipSchemaType } from '$lib/schema/helpers/fileNoteRelationship';
	import CheckboxInputForm from './CheckboxInputForm.svelte';

	let {
		filter,
		target,
		defaultTitle
	}: {
		filter: JournalFilterSchemaType;
		target: CreateFileNoteRelationshipSchemaType;
		defaultTitle?: string;
	} = $props();

	const form = superForm<CreateNoteJournalSchemaInputType>(
		{
			title: defaultTitle || `Data at ${formatDate(new Date(), $userDateFormat)}`,
			includeCount: true,
			includeSum: true,
			includeDateRange: true,
			filter,
			...target
		},
		{
			validators: zodClient(createNoteJournalSchema),
			dataType: 'json'
		}
	);

	const enhance = $derived(form.enhance);
	const loading = $derived(form.submitting);
</script>

<form
	method="post"
	action="?/addNoteJournalFilter"
	use:enhance
	class="flex w-full flex-col items-stretch gap-2"
>
	<input type="hidden" value={JSON.stringify(filter)} id="filter" />
	<TextInputForm {form} field="title" title="Title" />
	<P weight="bold">Dates</P>
	<div class="flex flex-row flex-wrap items-center gap-2">
		<CheckboxInputForm {form} field="includeDate" displayText="Current Date" />
		<CheckboxInputForm {form} field="includeDateRange" displayText="Date Range" />
		<CheckboxInputForm {form} field="includeEarliest" displayText="Earliest Journal" />
		<CheckboxInputForm {form} field="includeLatest" displayText="Latest Journal" />
	</div>

	<P weight="bold">Sum Of Journals</P>
	<div class="flex flex-row flex-wrap items-center gap-2">
		<CheckboxInputForm {form} field="includeSum" displayText="All" />
		<CheckboxInputForm {form} field="includeSumPositive" displayText="Positive" />
		<CheckboxInputForm {form} field="includeSumNegative" displayText="Negative" />
		<CheckboxInputForm
			{form}
			field="includeSumPositiveNoTransfer"
			displayText="Positive (Excl. Transfers)"
		/>
		<CheckboxInputForm
			{form}
			field="includeSumNegativeNoTransfer"
			displayText="Negative (Excl. Transfers)"
		/>
	</div>

	<P weight="bold">Count Of Journals</P>
	<div class="flex flex-row flex-wrap items-center gap-2">
		<CheckboxInputForm {form} field="includeCount" displayText="All" />
		<CheckboxInputForm {form} field="includeCountPositive" displayText="Positive" />
		<CheckboxInputForm {form} field="includeCountNegative" displayText="Negative" />
		<CheckboxInputForm
			{form}
			field="includeCountPositiveNoTransfer"
			displayText="Positive (Excl. Transfers)"
		/>
		<CheckboxInputForm
			{form}
			field="includeCountNegativeNoTransfer"
			displayText="Negative (Excl. Transfers)"
		/>
	</div>

	<div class="flex items-center justify-between">
		<ActionButton
			class="rounded-lg"
			type="submit"
			message="Create Note"
			loadingMessage="Creating..."
			loading={$loading}
		/>
		<Button class="rounded-lg" color="alternative">Cancel</Button>
	</div>
</form>
