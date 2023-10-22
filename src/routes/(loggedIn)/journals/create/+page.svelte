<script lang="ts">
	import CurrencyInputForm from '$lib/components/CurrencyInputForm.svelte';
	import CustomHeader from '$lib/components/CustomHeader.svelte';
	import ErrorText from '$lib/components/ErrorText.svelte';
	import PageLayout from '$lib/components/PageLayout.svelte';
	import TextInputForm from '$lib/components/TextInputForm.svelte';
	import DateInputForm from '$lib/components/DateInputForm.svelte';
	import type { CreateSimpleTransactionSuperType } from '$lib/schema/journalSchema.js';
	import { Button } from 'flowbite-svelte';
	import { superForm } from 'sveltekit-superforms/client';
	import CreateTransactionLinksForm from './CreateTransactionLinksForm.svelte';
	import CreateTransactionLabelsForm from './CreateTransactionLabelsForm.svelte';

	export let data;

	const form = superForm<CreateSimpleTransactionSuperType>(data.form);

	$: enhance = form.enhance;
	$: message = form.message;
</script>

<CustomHeader pageTitle="Create Transaction" />

<PageLayout title="Create Transaction" size="lg">
	<form method="POST" use:enhance class="flex flex-col gap-2">
		<TextInputForm title="Description" {form} field="description" />
		<DateInputForm title="Date" {form} field="date" />
		<CurrencyInputForm title="Amount" {form} field="amount" />
		<CreateTransactionLinksForm {form} dropdownInfo={data.dropdownInfo} />
		<CreateTransactionLabelsForm {form} dropdownInfo={data.dropdownInfo} />
		<Button type="submit">Create Transaction</Button>
		<ErrorText message={$message} />
	</form>
</PageLayout>
