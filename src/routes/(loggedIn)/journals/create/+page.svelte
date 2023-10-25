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
	import { page } from '$app/stores';
	import { pageInfo } from '$lib/routes';
	import RawDataModal from '$lib/components/RawDataModal.svelte';
	import PreviousUrlInput from '$lib/components/PreviousURLInput.svelte';

	export let data;

	const form = superForm<CreateSimpleTransactionSuperType>(data.form, { taintedMessage: null });

	$: urlInfo = pageInfo('/(loggedIn)/journals/create', $page);
	$: enhance = form.enhance;
	$: message = form.message;
	$: formData = form.form;
	$: testData = form.tainted;
</script>

<CustomHeader pageTitle="Create Transaction" />

<PageLayout title="Create Transaction" size="lg">
	<RawDataModal
		dev={data.dev}
		data={urlInfo.current.searchParams}
		buttonText="Current Search Params"
	/>
	<RawDataModal
		dev={data.dev}
		data={{ form: $formData, tainted: $testData, formOriginal: data.form }}
		buttonText="Form Data"
	/>
	<form method="POST" use:enhance class="grid grid-cols-1 md:grid-cols-2 gap-2">
		<PreviousUrlInput name="prevPage" />
		<input type="hidden" name="filter" value={JSON.stringify(urlInfo.current.searchParams)} />
		<input type="hidden" name="currentPage" value={urlInfo.current.url} />
		<TextInputForm title="Description" {form} field="description" />
		<DateInputForm title="Date" {form} field="date" />
		<CurrencyInputForm title="Amount" {form} field="amount" />
		<CreateTransactionLinksForm {form} dropdownInfo={data.dropdownInfo} />
		<CreateTransactionLabelsForm {form} dropdownInfo={data.dropdownInfo} />
		<Button class="md:col-span-2 mt-4" type="submit">Create Transaction</Button>
		<Button class="md:col-span-2 mt-4" on:click={() => form.reset()}>Reset</Button>
		<ErrorText message={$message} />
	</form>
</PageLayout>
