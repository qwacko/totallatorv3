<script lang="ts">
	import CustomHeader from '$lib/components/CustomHeader.svelte';
	import PageLayout from '$lib/components/PageLayout.svelte';
	import { Badge  } from 'flowbite-svelte';
	import FileLinkingCard from '$lib/components/FileLinkingCard.svelte';

	export let data;


	$: keys = Object.keys(data.searchParams).map((key) => ({
		key,
		value: data.searchParams[key as keyof typeof data.searchParams]
	}));
</script>

<CustomHeader pageTitle="Link Unlinked Files" />

<PageLayout title="Link Unlinked Files" subtitle="Connect To {data.titleInfo.text}" size="lg">
	<div class="flex flex-row flex-wrap gap-4">
		{#if data.unlinkedItems.length === 0}
			<Badge>No unlinked items</Badge>
		{:else}
			{#each data.unlinkedItems as item}
				<FileLinkingCard {item} {keys} />
			{/each}
		{/if}
	</div>
</PageLayout>
