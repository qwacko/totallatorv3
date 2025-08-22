<script lang="ts">
	import type { ReportElementItemData } from '@totallator/business-logic';

	import ReportElementContentsNonTimeGraph from './ReportElementContentsNonTimeGraph.svelte';
	import ReportElementContentsNumber from './ReportElementContentsNumber.svelte';
	import ReportElementContentsSparkline from './ReportElementContentsSparkline.svelte';
	import ReportElementContentsString from './ReportElementContentsString.svelte';
	import ReportElementContentsTimeline from './ReportElementContentsTimeline.svelte';

	const { data }: { data: ReportElementItemData | undefined } = $props();
</script>

{#if data}
	{#if data.type === 'number'}
		{@const test = data}
		<ReportElementContentsNumber data={test} />
	{:else if data.type === 'sparkline' || data.type === 'sparklinebar'}
		{@const test = data}
		<ReportElementContentsSparkline data={test} />
	{:else if data.type === 'string'}
		{@const test = data}
		<ReportElementContentsString data={test} />
	{:else if data.type === 'time_line' || data.type === 'time_stackedArea' || data.type === 'time_bar'}
		{@const test = data}
		<ReportElementContentsTimeline data={test} />
	{:else if data.type === 'pie' || data.type === 'box'}
		{@const test = data}
		<ReportElementContentsNonTimeGraph data={test} />
	{/if}
{/if}
