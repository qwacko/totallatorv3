<script lang="ts">
	import PageLayout from '$lib/components/PageLayout.svelte';
	import { Badge } from 'flowbite-svelte';

	export let data;
</script>

{#if data.journal.complete}
	<Badge>Journal Complete - No Update Possible</Badge>
{/if}
<PageLayout size="sm">
	{JSON.stringify(data.journal)}
	{JSON.stringify(data.otherJournals)}
</PageLayout>
