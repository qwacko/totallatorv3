<script lang="ts">
	import PageLayout from '$lib/components/PageLayout.svelte';
	import RawDataModal from '$lib/components/RawDataModal.svelte';
	import { Button, Heading } from 'flowbite-svelte';
	import { page } from '$app/stores';
	import { pageInfo, urlGenerator } from '$lib/routes';
	import { afterNavigate } from '$app/navigation';
	import { defaultJournalFilter } from '$lib/schema/journalSchema';
	import PreviousUrlInput from '$lib/components/PreviousURLInput.svelte';
	import { enhance } from '$app/forms';

	export let data;

	$: urlInfo = pageInfo('/(loggedIn)/journals/clone', $page);

	let prevPage = '';

	afterNavigate(({ from }) => {
		prevPage = from?.url.href || prevPage;
	});
</script>

<PageLayout title="Delete {data.journals.count} Journals">
	<RawDataModal {data} dev={data.dev} />

	<form method="post" action="?/delete" use:enhance class="flex flex-col gap-4">
		<PreviousUrlInput
			defaultURL={prevPage ||
				urlGenerator({
					address: '/(loggedIn)/journals',
					searchParamsValue: defaultJournalFilter
				}).url}
			name="prevPage"
		/>
		<input type="hidden" name="filter" value={JSON.stringify(urlInfo.current.searchParams)} />
		<input type="hidden" name="currentPage" value={urlInfo.current.url} />
		<Button class="w-full" type="submit">Delete {data.count} Journals</Button>
	</form>
</PageLayout>
