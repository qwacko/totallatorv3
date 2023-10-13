<script lang="ts">
	import PageLayout from '$lib/components/PageLayout.svelte';

	export let data;
</script>

<PageLayout subtitle={data.info.importInfo.title} title="Import Detail">
	id: {data.id}
	info:
	<pre>{JSON.stringify(data.info, null, 2)}</pre>
	{#await data.streaming.data then data}
		<pre>{JSON.stringify(data, null, 2)}</pre>
	{/await}
</PageLayout>
