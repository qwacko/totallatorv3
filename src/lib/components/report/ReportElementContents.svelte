<script lang="ts">
	import type { ReportElementData } from '$lib/server/db/actions/helpers/report/getData';
	import ReportElementContentsNumber from './ReportElementContentsNumber.svelte';

	export let data: ReportElementData;
</script>

{#if data}
	{#if data.type === 'number'}
		<ReportElementContentsNumber {data} />
	{:else}
		{data.type}
	{/if}
{/if}
