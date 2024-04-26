<script lang="ts">
	import CurrencyInputForm from '$lib/components/CurrencyInputForm.svelte';
	import CustomHeader from '$lib/components/CustomHeader.svelte';
	import ErrorText from '$lib/components/ErrorText.svelte';
	import PageLayout from '$lib/components/PageLayout.svelte';
	import TextInputForm from '$lib/components/TextInputForm.svelte';
	import DateInputForm from '$lib/components/DateInputForm.svelte';
	import { Button } from 'flowbite-svelte';
	import { superForm } from 'sveltekit-superforms';
	import CreateTransactionLinksForm from './CreateTransactionLinksForm.svelte';
	import CreateTransactionLabelsForm from './CreateTransactionLabelsForm.svelte';
	import { page } from '$app/stores';
	import { pageInfo } from '$lib/routes';
	import RawDataModal from '$lib/components/RawDataModal.svelte';
	import PreviousUrlInput from '$lib/components/PreviousURLInput.svelte';

	export let data;

	const form = superForm(data.form);

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
	<form method="POST" use:enhance class="grid grid-cols-1 gap-2 md:grid-cols-2">
		<PreviousUrlInput name="prevPage" />
		<input type="hidden" name="filter" value={JSON.stringify(urlInfo.current.searchParams)} />
		<input type="hidden" name="currentPage" value={urlInfo.current.url} />
		<TextInputForm title="Description" {form} field="description" />
		<DateInputForm title="Date" {form} field="date" />
		<CurrencyInputForm title="Amount" {form} field="amount" />
		<CreateTransactionLinksForm {form} />
		<CreateTransactionLabelsForm {form}  />
		<Button class="mt-4 md:col-span-2" type="submit">Create Transaction</Button>
		<Button class="mt-4 md:col-span-2" on:click={() => form.reset()}>Reset</Button>
		<ErrorText message={$message} />
	</form>
</PageLayout>
