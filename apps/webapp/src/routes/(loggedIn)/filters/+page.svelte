<script lang="ts">
	import { Button } from 'flowbite-svelte';

	import type { ReusableFilterFilterSchemaType } from '@totallator/shared';

	import { enhance } from '$app/forms';
	import { page } from '$app/state';

	import ActionButton from '$lib/components/ActionButton.svelte';
	import CustomHeader from '$lib/components/CustomHeader.svelte';
	import PageLayout from '$lib/components/PageLayout.svelte';
	import { customEnhance } from '$lib/helpers/customEnhance';
	import { pageInfo, urlGenerator } from '$lib/routes.js';

	import FilterTable from './FilterTable.svelte';

	const { data } = $props();

	const urlInfo = pageInfo('/(loggedIn)/filters', () => page);

	const tableConfig = $derived({
		dev: data.dev,
		filterText: data.filterText,
		urlForPage: (value: number) =>
			urlInfo.updateParamsURLGenerator({ searchParams: { page: value } }).url,
		urlForSort: (newSort: ReusableFilterFilterSchemaType['orderBy']) =>
			urlInfo.updateParamsURLGenerator({ searchParams: { orderBy: newSort } }).url
	});

	let refreshingSome = $state(false);
	let refreshingAll = $state(false);
	let refreshTime = $state(new Date());
	let now = $state(new Date()); // This will be updated every second

	// Reactive statement to calculate time since refresh
	const timeSinceRefreshSeconds = $derived(
		Math.floor((now.getTime() - refreshTime.getTime()) / 1000)
	);

	// Set an interval to update 'now' every second
	setInterval(() => {
		now = new Date();
	}, 1000);
</script>

<CustomHeader
	pageTitle="Reusable Filters"
	filterText={data.filterText}
	pageNumber={data.filters.page}
	numPages={data.filters.pageCount}
/>

<PageLayout title="Reusable Filters" size="xl">
	{#snippet slotRight()}
		<Button
			href={urlGenerator({
				address: '/(loggedIn)/filters/create',
				searchParamsValue: {}
			}).url}
			outline
		>
			Create
		</Button>
		<form
			class="flex"
			action="?/refreshAll"
			method="post"
			use:enhance={customEnhance({
				updateLoading(loading) {
					refreshingAll = loading;
					if (loading) {
						now = new Date();
						refreshTime = new Date();
					}
				}
			})}
		>
			<ActionButton
				type="submit"
				message="Refresh All"
				loadingMessage="Refreshing All ({timeSinceRefreshSeconds}s)..."
				loading={refreshingAll}
				disabled={refreshingSome}
				outline
			/>
		</form>
		<form
			class="flex"
			action="?/refreshSome"
			method="post"
			use:enhance={customEnhance({
				updateLoading(loading) {
					refreshingSome = loading;
					if (loading) {
						now = new Date();
						refreshTime = new Date();
					}
				}
			})}
		>
			{#await data.streamed.filters then filters}
				{#each filters.data as filter}
					<input type="hidden" name="id" value={filter.id} />
				{/each}
				<ActionButton
					type="submit"
					message="Refresh Displayed"
					loadingMessage="Refreshing Displayed ({timeSinceRefreshSeconds}s)..."
					outline
					disabled={refreshingAll}
					loading={refreshingSome}
				/>
			{/await}
		</form>
	{/snippet}

	{#if urlInfo.current.searchParams}
		{#await data.streamed.filters}
			<FilterTable
				dataForTable={data.filters}
				loading={true}
				bind:urlParams={urlInfo.current}
				{...tableConfig}
			/>
		{:then dataForUse}
			<FilterTable
				dataForTable={dataForUse}
				loading={false}
				bind:urlParams={urlInfo.current}
				{...tableConfig}
			/>
		{/await}
	{/if}
</PageLayout>
