<script lang="ts">
	import { Badge } from 'flowbite-svelte';

	import type { GetReportConfigResult } from '@totallator/business-logic';

	import ReportElementContents from '$lib/components/report/contents/ReportElementContents.svelte';

	const { id, data }: { id: string; data: GetReportConfigResult } = $props();

	const thisData = $derived(
		data?.reportElementsWithData ? data.reportElementsWithData.find((d) => d.id === id) : undefined
	);
</script>

{#if !thisData}
	<Badge color="red">Report element not found</Badge>
{:else}
	<ReportElementContents data={thisData} />
{/if}
