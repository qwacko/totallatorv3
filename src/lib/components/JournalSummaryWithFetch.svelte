<script lang="ts">
	import { urlGenerator } from '$lib/routes';
	import type { JournalFilterSchemaWithoutPaginationType } from '$lib/schema/journalSchema';
	import type { SummaryCacheSchemaDataType } from '$lib/schema/summaryCacheSchema';
	import { Button, Spinner } from 'flowbite-svelte';
	import SuperJSON from 'superjson';
	import { showSummaryStore } from '$lib/stores/popoverView';
	import { browser } from '$app/environment';
	import JournalSummaryPopoverContent from './JournalSummaryPopoverContent.svelte';
	import EyeIcon from './icons/EyeIcon.svelte';

	export let filter: JournalFilterSchemaWithoutPaginationType;
	export let latestUpdate: Date;

	let cachedData: undefined | SummaryCacheSchemaDataType = undefined;

	$: dataURL = urlGenerator({
		address: '/(loggedIn)/journals/summaryData',
		searchParamsValue: filter
	}).url;
	$: latestUpdateString = latestUpdate.toISOString();

	let updating = false;

	$: if ($showSummaryStore && browser && latestUpdateString) {
		updating = true;
		fetch(dataURL)
			.then((response) => response.text())
			.then((data) => {
				cachedData = SuperJSON.parse(data) as SummaryCacheSchemaDataType;
				updating = false;
			})
			.catch((error) => {
				console.error('Error:', error);
			})
			.finally(() => {
				updating = false;
			});
	}
</script>

{#if !$showSummaryStore || !cachedData}
	<Button
		color="light"
		size="xs"
		on:click={() => ($showSummaryStore = true)}
		class="hidden h-8 flex-row gap-2 self-start md:flex"
	>
		<EyeIcon /> Show Summary {#if updating}<Spinner size="4" />{/if}
	</Button>
{:else}
	<JournalSummaryPopoverContent item={cachedData} summaryFilter={filter} loading={updating} />
{/if}
