<script lang="ts">
	import type { GetReportElementDataType } from '$lib/server/db/actions/reportActions';
	import { Badge, Spinner } from 'flowbite-svelte';

	export let id: string;
	export let data: GetReportElementDataType[];

	$: thisData = data.find((d) => d.id === id);
</script>

{#if !thisData}
	<Badge color="red">Report element not found</Badge>
{:else}
	{#await thisData.data}
		<Spinner />
	{:then currentData}
		{#if currentData}
			{currentData.id} - {currentData.title}
		{:else}
			<Badge color="red">Report element not found</Badge>
		{/if}
	{/await}
{/if}
