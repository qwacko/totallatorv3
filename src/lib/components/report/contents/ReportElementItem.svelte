<script lang="ts">
	import type { ReportElementItemData } from '$lib/server/db/actions/helpers/report/getData';
	import ReportElementContentsNumber from './ReportElementContentsNumber.svelte';
	import ReportElementContentsSparkline from './ReportElementContentsSparkline.svelte';
	import ReportElementContentsString from './ReportElementContentsString.svelte';
	import ReportElementContentsTimeline from './ReportElementContentsTimeline.svelte';

	export let data: ReportElementItemData | undefined;
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
	{/if}
{/if}
