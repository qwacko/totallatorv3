<script lang="ts">
	import { urlGenerator } from '$lib/routes';
	import type { JournalRecommendationSchemaType } from '$lib/schema/journalRecommendationSchema';
	import type { JournalRecommendationsReturnType } from '$lib/server/db/actions/journalMaterializedViewActions';
	import SuperJSON from 'superjson';
	import { untrack } from 'svelte';

	const {
		target
	}: {
		target: JournalRecommendationSchemaType;
	} = $props();

	let updating = $state(false);
	let recommendations = $state<JournalRecommendationsReturnType | undefined>(undefined);
	let debounceTimer: NodeJS.Timeout | undefined = undefined;
	const debounceTimeout = 500;

	const updateData = (request: JournalRecommendationSchemaType) => {
		updating = true;

		if (debounceTimer) {
			clearTimeout(debounceTimer);
		}

		debounceTimer = setTimeout(() => {
			const dataURL = urlGenerator({
				address: '/(loggedIn)/journals/bulkEdit/recommendations',
				searchParamsValue: request
			});

			fetch(dataURL.url)
				.then((response) => response.text())
				.then((newData) => {
					const receivedJSON = SuperJSON.parse(
						newData
					) as unknown as JournalRecommendationsReturnType;
					console.log('data', receivedJSON);
					recommendations = receivedJSON;
					updating = false;
				})
				.catch((error) => {
					console.error('Error:', error);
				})
				.finally(() => {
					updating = false;
				});
		}, debounceTimeout);
	};

	$effect(() => {
		const updateDataFunction = untrack(() => updateData);
		updateDataFunction(target);
	});


</script>

<div class="bulk-recommendations">
	<h2>Bulk Edit Recommendations</h2>

	{#if updating}
		<p>Updating recommendations...</p>
	{:else if recommendations}
		{#if recommendations.type === 'account'}
			<h3>Recommendations for Account</h3>
			<ul>
				{#each recommendations.data as recommendation}
					<li>
						<strong>Description:</strong>
						{recommendation.description}
						<br />
						<strong>Tag:</strong>
						{recommendation.tagTitle}
						<br />
						<strong>Category:</strong>
						{recommendation.categoryTitle}
						<br />
						<strong>Bill:</strong>
						{recommendation.billTitle}
						<br />
						<strong>Budget:</strong>
						{recommendation.budgetTitle}
						<br />
						<strong>Count:</strong>
						{recommendation.count}
					</li>
				{/each}
			</ul>
		{:else if recommendations.type === 'description'}
			<h3>Recommendations for Description</h3>
			<ul>
				{#each recommendations.data as recommendation}
					<li>
						<strong>Description:</strong>
						{recommendation.description}
						<br />
						<strong>Tag:</strong>
						{recommendation.tagTitle}
						<br />
						<strong>Category:</strong>
						{recommendation.categoryTitle}
						<br />
						<strong>Bill:</strong>
						{recommendation.billTitle}
						<br />
						<strong>Budget:</strong>
						{recommendation.budgetTitle}
						<br />
						<strong>Account:</strong>
						{recommendation.accountTitle}
					</li>
				{/each}
			</ul>
		{/if}
	{:else}
		<p>No recommendations available.</p>
	{/if}
</div>

<style>
	.bulk-recommendations {
		margin-top: 20px;
		padding: 15px;
		border: 1px solid #ccc;
		border-radius: 5px;
	}

	h2 {
		margin-bottom: 15px;
	}

	h3 {
		margin-top: 10px;
		margin-bottom: 10px;
	}

	ul {
		list-style-type: none;
		padding-left: 0;
	}

	li {
		margin-bottom: 15px;
		padding: 10px;
		background-color: #f9f9f9;
		border-radius: 3px;
	}

	strong {
		display: inline-block;
		width: 100px;
	}
</style>
