<script lang="ts">
	import PageLayout from '$lib/components/PageLayout.svelte';
	import RawDataModal from '$lib/components/RawDataModal.svelte';
	import { Button, Heading } from 'flowbite-svelte';
	import BulkEditState from './BulkEditState.svelte';
	import { page } from '$app/stores';
	import { pageInfo, urlGenerator } from '$lib/routes';
	import { afterNavigate } from '$app/navigation';
	import { superForm } from 'sveltekit-superforms/client';
	import {
		defaultJournalFilter,
		type UpdateJournalSchemaSuperType
	} from '$lib/schema/journalSchema';
	import ErrorText from '$lib/components/ErrorText.svelte';
	import PreviousUrlInput from '$lib/components/PreviousURLInput.svelte';

	export let data;

	$: urlInfo = pageInfo('/(loggedIn)/journals/bulkEdit', $page);

	let prevPage = '';

	afterNavigate(({ from }) => {
		prevPage = from?.url.href || prevPage;
	});

	const { form, errors, constraints, message, enhance } = superForm<UpdateJournalSchemaSuperType>(
		data.form,
		{ taintedMessage: null }
	);
</script>

<PageLayout title="Bulk Edit {data.journals.count} Journals">
	<RawDataModal data={data.selectedJournals} dev={data.dev} />
	<RawDataModal data={urlInfo} dev={data.dev} />
	<Heading tag="h3">Set Journal State</Heading>
	<BulkEditState
		{prevPage}
		currentPage={urlInfo.current.url}
		filter={urlInfo.current.searchParams}
		complete={data.selectedJournals.complete}
		reconciled={data.selectedJournals.reconciled}
		dataChecked={data.selectedJournals.dataChecked}
		canEdit={data.selectedJournals.canEdit}
	/>
	<Heading tag="h3">Update Data</Heading>
	{#if !data.selectedJournals.canEdit}<ErrorText
			message="At Least One Journal Is Complete So Cannot Update Journals"
			title="Complete Journals Present"
		/>{:else}<div>Hi</div>{/if}

	<Heading tag="h3">Clone Journals</Heading>
	<form method="post" action="?/clone" use:enhance>
		<PreviousUrlInput
			defaultURL={urlGenerator({
				address: '/(loggedIn)/journals',
				searchParamsValue: defaultJournalFilter
			}).url}
			name="prevPage"
		/>
		<input type="hidden" name="filter" value={JSON.stringify(urlInfo.current.searchParams)} />
		<input type="hidden" name="currentPage" value={urlInfo.current.url} />
		<Button type="submit">Clone {data.journals.count} Journals</Button>
	</form>
</PageLayout>
