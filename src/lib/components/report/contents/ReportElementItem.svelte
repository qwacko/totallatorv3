<script lang="ts">
	import type { ReportElementItemData } from '$lib/server/db/actions/helpers/report/getData';
	import ReportElementContentsNumber from './ReportElementContentsNumber.svelte';
	import ReportElementSparkline from './ReportElementSparkline.svelte';
	import ReportElementContentsString from './ReportElementContentsString.svelte';

	export let data: ReportElementItemData | undefined;
</script>

{#if data}
	{#if data.type === 'number' || data.type === 'currency'}
		<ReportElementContentsNumber {data} />
	{:else if data.type === 'sparkline' || data.type === 'sparklinebar'}
		<ReportElementSparkline {data} />
	{:else if data.type === 'string'}
		<ReportElementContentsString {data} />
	{/if}
{/if}
