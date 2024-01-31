<script lang="ts">
	import type { ReportElementDataForUse } from '$lib/server/db/actions/reportActions';
	import ReportElementItem from './ReportElementItem.svelte';

	export let data: ReportElementDataForUse;
</script>

{#each data.itemData as item}
	{#if item}
		<ReportElementItem data={item} />
	{/if}
{/each}
