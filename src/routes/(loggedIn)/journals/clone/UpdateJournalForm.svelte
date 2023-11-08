<script lang="ts">
	import type { UpdateJournalSchemaSuperType } from '$lib/schema/journalSchema';
	import TextInputForm from '$lib/components/TextInputForm.svelte';

	import type { SuperForm } from 'sveltekit-superforms/client';
	import DateInputForm from '$lib/components/DateInputForm.svelte';
	import CurrencyInputForm from '$lib/components/CurrencyInputForm.svelte';
	import BooleanInputForm from '$lib/components/BooleanInputForm.svelte';

	export let form: SuperForm<UpdateJournalSchemaSuperType>;
</script>

<TextInputForm title="Description" {form} field="description" />
<DateInputForm title="Date" {form} field="date" />
<CurrencyInputForm title="Amount" {form} field="amount" />
<BooleanInputForm title="Complete" {form} field="complete" />
<BooleanInputForm title="Reconciled" {form} field="reconciled" />
<BooleanInputForm title="Data Checked" {form} field="dataChecked" />
