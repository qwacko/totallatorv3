<script lang="ts">
	import { Button } from 'flowbite-svelte';
	import { routeStore } from '$lib/prevPageStore';

	export let routeBased = false;
</script>

{#if routeBased}
	<Button href={$routeStore.prevRouteURL} {...$$restProps}>
		<slot>Cancel</slot>
	</Button>
{:else}
	<Button on:click={() => window.history.back()} {...$$restProps}>
		<slot>Cancel</slot>
	</Button>
{/if}
