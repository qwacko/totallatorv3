<script lang="ts">
	import PageLayout from '$lib/components/PageLayout.svelte';
	import RawDataModal from '$lib/components/RawDataModal.svelte';
	import { Button, Heading } from 'flowbite-svelte';
	import { page } from '$app/stores';
	import { pageInfo, urlGenerator } from '$lib/routes';
	import { afterNavigate } from '$app/navigation';
	import { superForm } from 'sveltekit-superforms/client';
	import {
		defaultJournalFilter,
		type UpdateJournalSchemaSuperType
	} from '$lib/schema/journalSchema';
	import PreviousUrlInput from '$lib/components/PreviousURLInput.svelte';
	import DateInput from '$lib/components/DateInput.svelte';
	import TextInput from '$lib/components/TextInput.svelte';
	import CurrencyInput from '$lib/components/CurrencyInput.svelte';
	import UpdateJournalForm from './UpdateJournalForm.svelte';

	export let data;

	$: urlInfo = pageInfo('/(loggedIn)/journals/clone', $page);

	let prevPage = '';

	afterNavigate(({ from }) => {
		prevPage = from?.url.href || prevPage;
	});

	const form = superForm<UpdateJournalSchemaSuperType>(data.form, { taintedMessage: null });

	$: enhance = form.enhance;
</script>

<PageLayout title="Clone {data.journals.count} Journals">
	<RawDataModal data={data.selectedJournals} dev={data.dev} />
	<RawDataModal data={urlInfo} dev={data.dev} />

	<Heading tag="h3">Modify Cloned Journals</Heading>
	<form method="post" action="?/clone" use:enhance class="flex flex-col gap-4">
		<PreviousUrlInput
			defaultURL={urlGenerator({
				address: '/(loggedIn)/journals',
				searchParamsValue: defaultJournalFilter
			}).url}
			name="prevPage"
		/>
		<input type="hidden" name="filter" value={JSON.stringify(urlInfo.current.searchParams)} />
		<input type="hidden" name="currentPage" value={urlInfo.current.url} />
		<UpdateJournalForm {form} />
		<!-- <DateInput
			title="Date"
			name="date"
			bind:value={$form.date}
			{...$constraints.date}
			errorMessage={$errors.date}
			clearable={false}
		/>
		<TextInput
			title="Description"
			errorMessage={$errors.description}
			name="description"
			bind:value={$form.description}
			{...$constraints.description}
		/>
		<CurrencyInput
			title="Amount"
			errorMessage={$errors.amount}
			name="amount"
			bind:value={$form.amount}
			step={0.01}
		/> -->

		<Button class="w-full" type="submit">Clone {data.journals.count} Journals</Button>
	</form>
</PageLayout>
