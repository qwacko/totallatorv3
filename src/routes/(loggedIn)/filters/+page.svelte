<script lang="ts">
	import { Button } from 'flowbite-svelte';
	import PageLayout from '$lib/components/PageLayout.svelte';
	import { page } from '$app/stores';
	import { pageInfo, pageInfoStore, urlGenerator } from '$lib/routes.js';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import CustomHeader from '$lib/components/CustomHeader.svelte';
	import FilterTable from './FilterTable.svelte';
	import type { ReusableFilterFilterSchemaType } from '$lib/schema/reusableFilterSchema';

	export let data;

	$: urlInfo = pageInfo('/(loggedIn)/filters', $page);

	const urlStore = pageInfoStore({
		routeId: '/(loggedIn)/filters',
		pageInfo: page,
		onUpdate: (newURL) => {
			if (browser && newURL !== urlInfo.current.url) {
				goto(newURL, { keepFocus: true, noScroll: true });
			}
		},
		updateDelay: 500
	});

	$: tableConfig = {
		dev: data.dev,
		filterText: data.filterText,
		urlForPage: (value: number) => urlInfo.updateParams({ searchParams: { page: value } }).url,
		urlForSort: (newSort: ReusableFilterFilterSchemaType['orderBy']) =>
			urlInfo.updateParams({ searchParams: { orderBy: newSort } }).url
	};
</script>

<CustomHeader
	pageTitle="Reusable Filters"
	filterText={data.filterText}
	pageNumber={data.filters.page}
	numPages={data.filters.pageCount}
/>

<PageLayout title="Reusable Filters" size="xl">
	<svelte:fragment slot="right">
		<Button
			href={urlGenerator({ address: '/(loggedIn)/filters/create', searchParamsValue: {} }).url}
			color="light"
			outline
		>
			Create
		</Button>
	</svelte:fragment>

	{#if $urlStore.searchParams}
		{#await data.streamed.filters}
			<FilterTable
				dataForTable={data.filters}
				loading={true}
				bind:searchParams={$urlStore.searchParams}
				{...tableConfig}
			/>
		{:then dataForUse}
			<FilterTable
				dataForTable={dataForUse}
				loading={false}
				bind:searchParams={$urlStore.searchParams}
				{...tableConfig}
			/>
		{/await}
	{/if}
</PageLayout>
