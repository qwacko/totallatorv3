<script lang="ts">
	import type { UpdateJournalSchemaSuperType } from '$lib/schema/journalSchema';
	import TextInputForm from '$lib/components/TextInputForm.svelte';

	import type { SuperForm } from 'sveltekit-superforms/client';
	import DateInputForm from '$lib/components/DateInputForm.svelte';
	import CurrencyInputForm from '$lib/components/CurrencyInputForm.svelte';

	export let form: SuperForm<UpdateJournalSchemaSuperType>;
</script>

<TextInputForm title="Description" {form} field="description" />
<DateInputForm title="Date" {form} field="date" />
<CurrencyInputForm title="Amount" {form} field="amount" />
