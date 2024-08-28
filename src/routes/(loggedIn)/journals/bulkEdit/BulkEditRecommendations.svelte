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

Bulk Recomendations Go Here

{#if updating}
	<p>Updating...</p>
{:else}
	<p>Updated</p>
{/if}
