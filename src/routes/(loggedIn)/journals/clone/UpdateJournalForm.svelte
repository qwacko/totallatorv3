<script lang="ts">
	import type { UpdateJournalSchemaSuperType } from '$lib/schema/journalSchema';
	import TextInputForm from '$lib/components/TextInputForm.svelte';

	import type { SuperForm } from 'sveltekit-superforms/client';
	import DateInputForm from '$lib/components/DateInputForm.svelte';
	import CurrencyInputForm from '$lib/components/CurrencyInputForm.svelte';
	import BooleanSetClearForm from '$lib/components/BooleanSetClearForm.svelte';

	export let form: SuperForm<UpdateJournalSchemaSuperType>;
</script>

<TextInputForm title="Description" {form} field="description" />
<DateInputForm title="Date" {form} field="date" />
<CurrencyInputForm title="Amount" {form} field="amount" />
<BooleanSetClearForm title="Complete" {form} setField="setComplete" clearField="clearComplete" />
<BooleanSetClearForm
	title="Reconciled"
	{form}
	setField="setReconciled"
	clearField="clearReconciled"
/>
<BooleanSetClearForm
	title="Data Checked"
	{form}
	setField="setDataChecked"
	clearField="clearDataChecked"
/>
