<script lang="ts">
	import { pageStore, routeStore } from '$lib/prevPageStore';

	const {
		name = 'previousURL',
		routeBased = false
	}: {
		name?: string;
		routeBased?: boolean;
	} = $props();
</script>

{#if routeBased}
	<input type="hidden" {name} value={$routeStore.prevRouteURL} />
{:else}
	<input type="hidden" {name} value={$pageStore.prevURL} />
{/if}
