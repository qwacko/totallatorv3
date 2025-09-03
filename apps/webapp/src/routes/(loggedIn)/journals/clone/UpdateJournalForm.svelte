<script lang="ts">
	import type { SuperForm } from 'sveltekit-superforms';

	import type { UpdateJournalSchemaType } from '@totallator/shared';

	import BooleanSetClearForm from '$lib/components/BooleanSetClearForm.svelte';
	import CurrencyInputForm from '$lib/components/CurrencyInputForm.svelte';
	import DateInputForm from '$lib/components/DateInputForm.svelte';
	import LlmStatusForm from '$lib/components/LlmStatusForm.svelte';
	import RecommendText from '$lib/components/recommendText/RecommendText.svelte';
	import TextInputForm from '$lib/components/TextInputForm.svelte';

	const { form }: { form: SuperForm<UpdateJournalSchemaType> } = $props();

	const formData = form.form;
</script>

<TextInputForm title="Description" {form} field="description">
	<RecommendText
		payeeId={$formData.otherAccountId}
		updateText={(text) => form.form.update((data) => ({ ...data, description: text }))}
	/>
</TextInputForm>
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
<LlmStatusForm title="LLM Review Status" {form} field="llmReviewStatus" />
