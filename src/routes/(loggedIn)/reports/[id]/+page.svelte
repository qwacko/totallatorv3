<script lang="ts">
	import PageLayout from '$lib/components/PageLayout.svelte';
	import CustomHeader from '$lib/components/CustomHeader.svelte';
	import ReportGridWrapper from '$lib/components/report/ReportGridWrapper.svelte';
	import ReportGridItem from '$lib/components/report/ReportGridItem.svelte';
	import RawDataModal from '$lib/components/RawDataModal.svelte';

	export let data;
</script>

<CustomHeader pageTitle="Report - {data.report.title}" />

<PageLayout title={data.report.title} size={data.report.size}>
	<RawDataModal data={data.report} dev={data.dev} />
	<ReportGridWrapper>
		{#each data.report.reportElements as { cols, rows, title }}
			<ReportGridItem {cols} {rows} highlightOnHover={false} {title}>Data Goes Here</ReportGridItem>
		{/each}
	</ReportGridWrapper>
</PageLayout>
