<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import CustomHeader from '$lib/components/CustomHeader.svelte';
	import FilterModal from '$lib/components/FilterModal.svelte';
	import PageLayout from '$lib/components/PageLayout.svelte';
	import JournalEntryIcon from '$lib/components/icons/JournalEntryIcon.svelte';
	import { pageInfo, pageInfoStore, urlGenerator } from '$lib/routes.js';
	import { defaultJournalFilter } from '$lib/schema/journalSchema.js';
	import { Button, P } from 'flowbite-svelte';

	export let data;

	$: urlInfo = pageInfo('/(loggedIn)/filters/create', $page);

	const urlStore = pageInfoStore({
		routeId: '/(loggedIn)/filters/create',
		pageInfo: page,
		onUpdate: (newURL) => {
			if (browser && newURL !== urlInfo.current.url) {
				goto(newURL, { keepFocus: true, noScroll: true });
			}
		},
		updateDelay: 500
	});
</script>

<CustomHeader pageTitle="Create Reusable Filter" />

<PageLayout title="Create Reusable Filter" size="xl">
	<P class="self-center" weight="semibold">Filter</P>
	<div class="flex flex-row gap-6 items-center self-center">
		<div class="flex flex-col gap-1">
			<FilterModal
				currentFilter={data.searchParams?.filter || defaultJournalFilter()}
				accountDropdown={data.dropdowns.account}
				billDropdown={data.dropdowns.bill}
				categoryDropdown={data.dropdowns.category}
				budgetDropdown={data.dropdowns.budget}
				tagDropdown={data.dropdowns.tag}
				labelDropdown={data.dropdowns.label}
				urlFromFilter={(filter) => urlInfo.updateParams({ searchParams: { filter } }).url}
			/>
			<Button
				href={urlGenerator({
					address: '/(loggedIn)/journals',
					searchParamsValue: data.searchParams?.filter || defaultJournalFilter()
				}).url}
				color="blue"
				outline
				size="sm"
			>
				<JournalEntryIcon />
			</Button>
		</div>
		<div class="flex flex-col gap-1">
			{#each data.filterText as currentFilterText}
				<div class="flex">{currentFilterText}</div>
			{/each}
			<div class="flex text-gray-400">{data.numberResults} matching journals</div>
		</div>
	</div>
</PageLayout>
