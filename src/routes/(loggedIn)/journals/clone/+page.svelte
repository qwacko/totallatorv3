<script lang="ts">
	import PageLayout from '$lib/components/PageLayout.svelte';
	import { Button, Heading } from 'flowbite-svelte';
	import { page } from '$app/stores';
	import { pageInfo } from '$lib/routes';
	import { superForm } from 'sveltekit-superforms/client';
	import type { CloneJournalUpdateSchemaSuperType } from '$lib/schema/journalSchema';
	import PreviousUrlInput from '$lib/components/PreviousURLInput.svelte';
	import PrevPageButton from '$lib/components/PrevPageButton.svelte';
	import UpdateJournalLabelsForm from './UpdateJournalLabelsForm.svelte';
	import CustomHeader from '$lib/components/CustomHeader.svelte';
	import CloneJournalLinksForm from './CloneJournalLinksForm.svelte';
	import CloneJournalForm from './CloneJournalForm.svelte';

	export let data;

	$: urlInfo = pageInfo('/(loggedIn)/journals/clone', $page);

	const form = superForm<CloneJournalUpdateSchemaSuperType>(data.form, { taintedMessage: null });

	$: enhance = form.enhance;
	$: tainted = form.tainted;
</script>

<CustomHeader
	pageTitle="Clone {data.journals.count} Journal{data.journals.count > 1 ? 's' : ''}"
	filterText={data.filterText}
/>

<PageLayout title="Clone {data.journals.count} Journals">
	<Heading tag="h3">Modify Cloned Journals</Heading>
	<form method="post" action="?/clone" use:enhance class="grid grid-cols-1 md:grid-cols-2 gap-2">
		<PreviousUrlInput name="prevPage" />
		<input type="hidden" name="filter" value={JSON.stringify(urlInfo.current.searchParams)} />
		<input type="hidden" name="currentPage" value={urlInfo.current.url} />
		<CloneJournalForm {form} />
		<CloneJournalLinksForm {form} dropdownInfo={data.streamed.dropdownInfo} />
		<UpdateJournalLabelsForm
			{form}
			dropdownInfo={data.streamed.dropdownInfo}
			allLabelIds={data.allLabelIds}
			commonLabelIds={data.commonLabelIds}
		/>
		<Button class="w-full" type="submit">Clone {data.journals.count} Journals</Button>
		<Button disabled={!$tainted} class="w-full" on:click={() => form.reset()}>Reset</Button>
		<PrevPageButton class="w-full">Cancel</PrevPageButton>
	</form>
</PageLayout>
