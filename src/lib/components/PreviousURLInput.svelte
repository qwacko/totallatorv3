<script lang="ts">
	import { pageStore, routeStore } from '$lib/prevPageStore';
	export let name = 'previousURL';
	export let routeBased = false;
</script>

{#if routeBased}
	<input type="hidden" {name} value={$routeStore.prevRouteURL} />
{:else}
	<input type="hidden" {name} value={$pageStore.prevURL} />
{/if}
