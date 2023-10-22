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

	const form = superForm<CreateSimpleTransactionSuperType>(data.form);

	$: urlInfo = pageInfo('/(loggedIn)/journals/create', $page);
	$: enhance = form.enhance;
	$: message = form.message;
</script>

<CustomHeader pageTitle="Create Transaction" />

<PageLayout title="Create Transaction" size="lg">
	<RawDataModal
		dev={data.dev}
		data={urlInfo.current.searchParams}
		buttonText="Current Search Params"
	/>
	<div class="flex">{urlInfo.current.url}</div>
	<form method="POST" use:enhance class="flex flex-col gap-2">
		<PreviousUrlInput name="prevPage" />
		<input type="hidden" name="filter" value={JSON.stringify(urlInfo.current.searchParams)} />
		<input type="hidden" name="currentPage" value={urlInfo.current.url} />
		<TextInputForm title="Description" {form} field="description" />
		<DateInputForm title="Date" {form} field="date" />
		<CurrencyInputForm title="Amount" {form} field="amount" />
		<CreateTransactionLinksForm {form} dropdownInfo={data.dropdownInfo} />
		<CreateTransactionLabelsForm {form} dropdownInfo={data.dropdownInfo} />
		<Button type="submit">Create Transaction</Button>
		<ErrorText message={$message} />
	</form>
</PageLayout>
