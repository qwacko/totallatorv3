<script lang="ts">
	import type { CloneJournalUpdateSchemaType } from '$lib/schema/journalSchema';
	import TextInputForm from '$lib/components/TextInputForm.svelte';

	import type { SuperForm } from 'sveltekit-superforms';
	import DateInputForm from '$lib/components/DateInputForm.svelte';
	import CurrencyInputForm from '$lib/components/CurrencyInputForm.svelte';

	export let form: SuperForm<CloneJournalUpdateSchemaType>;
</script>

<TextInputForm title="Description" {form} field="description" />
<DateInputForm title="Date" {form} field="date" />
<CurrencyInputForm title="To Amount" {form} field="toAmount" />
