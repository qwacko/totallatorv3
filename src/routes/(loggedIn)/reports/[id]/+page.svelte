<script lang="ts">
	import PageLayout from '$lib/components/PageLayout.svelte';
	import CustomHeader from '$lib/components/CustomHeader.svelte';

	export let data;
</script>

<CustomHeader pageTitle="Report - {data.report.title}" />

<PageLayout title={data.report.title} size="sm">
	<pre>{JSON.stringify(data.report, null, 2)}</pre>
</PageLayout>
