<script lang="ts">
	import { Button, Spinner } from 'flowbite-svelte';
	import SuperJSON from 'superjson';

	import type { JournalFilterSchemaWithoutPaginationType } from '@totallator/shared';
	import type { SummaryCacheSchemaDataType } from '@totallator/shared';

	import { browser } from '$app/environment';

	import { urlGenerator } from '$lib/routes';
	import { showSummaryStore } from '$lib/stores/popoverView';

	import EyeIcon from './icons/EyeIcon.svelte';
	import JournalSummaryPopoverContent from './JournalSummaryPopoverContent.svelte';

	const {
		filter,
		latestUpdate
	}: {
		filter: JournalFilterSchemaWithoutPaginationType;
		latestUpdate: Date;
	} = $props();

	let cachedData = $state<undefined | SummaryCacheSchemaDataType>(undefined);

	const dataURL = $derived(
		urlGenerator({
			address: '/(loggedIn)/journals/summaryData',
			searchParamsValue: filter
		}).url
	);
	const latestUpdateString = $derived(latestUpdate.toISOString());

	let updating = $state(false);

	$effect(() => {
		if ($showSummaryStore && browser && latestUpdateString) {
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
	});
</script>

{#if !$showSummaryStore || !cachedData}
	<Button
		color="light"
		size="xs"
		onclick={() => ($showSummaryStore = true)}
		class="hidden h-8 flex-row gap-2 self-start md:flex"
	>
		<EyeIcon /> Show Summary {#if updating}<Spinner size="4" />{/if}
	</Button>
{:else}
	<JournalSummaryPopoverContent item={cachedData} summaryFilter={filter} loading={updating} />
{/if}
