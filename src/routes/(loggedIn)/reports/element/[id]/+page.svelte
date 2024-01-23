<script lang="ts">
	import CustomHeader from '$lib/components/CustomHeader.svelte';
	import PageLayout from '$lib/components/PageLayout.svelte';
	import { Button, Heading, P } from 'flowbite-svelte';

	export let data;
</script>

<CustomHeader pageTitle={data.elementData.title || 'Report Element'} />

<PageLayout title={data.elementData.title || 'Report Element'} size="lg">
	<Heading tag="h4">Report Information</Heading>
	<div class="flex flex-row gap-2">
		<P weight="bold">Title :</P>
		<P>{data.elementData.report.title}</P>
	</div>
	<Heading tag="h4">Report Element Configuration</Heading>
	<pre>
    {JSON.stringify(data.elementData, null, 2)}
</pre>
</PageLayout>
