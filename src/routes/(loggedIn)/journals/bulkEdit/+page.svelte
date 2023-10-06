<script lang="ts">
	import PageLayout from '$lib/components/PageLayout.svelte';
	import RawDataModal from '$lib/components/RawDataModal.svelte';
	import { Heading } from 'flowbite-svelte';
	import BulkEditState from './BulkEditState.svelte';
	import { page } from '$app/stores';
	import { pageInfo } from '$lib/routes';
	import { afterNavigate } from '$app/navigation';

	export let data;

	$: urlInfo = pageInfo('/(loggedIn)/journals/bulkEdit', $page);

	let prevPage = '';

	afterNavigate(({ from }) => {
		prevPage = from?.url.href || prevPage;
	});
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
	/>
</PageLayout>
