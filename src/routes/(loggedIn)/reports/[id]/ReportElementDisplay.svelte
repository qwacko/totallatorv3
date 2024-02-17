<script lang="ts">
	import ReportElementContents from '$lib/components/report/contents/ReportElementContents.svelte';
	import type { GetReportConfigResult } from '$lib/server/db/actions/reportActions';
	import { Badge } from 'flowbite-svelte';

	export let id: string;
	export let data: GetReportConfigResult;

	$: thisData = data?.reportElementsWithData
		? data.reportElementsWithData.find((d) => d.id === id)
		: undefined;
</script>

{#if !thisData}
	<Badge color="red">Report element not found</Badge>
{:else}
	<ReportElementContents data={thisData} />
{/if}
