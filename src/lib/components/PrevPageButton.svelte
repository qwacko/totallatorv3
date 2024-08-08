<script lang="ts">
	import { Button } from 'flowbite-svelte';
	import { routeStore } from '$lib/prevPageStore';
	import type { ComponentProps, Snippet } from 'svelte';

	type ButtonProps = ComponentProps<Button>;

	const {
		routeBased = false,
		children,
		...restProps
	}: {
		routeBased?: boolean;
		children?: Snippet;
	} & ButtonProps = $props();
</script>

{#if routeBased}
	<Button href={$routeStore.prevRouteURL} {...restProps}>
		{#if children}
			{@render children()}
		{:else}
			Cancel
		{/if}
	</Button>
{:else}
	<Button on:click={() => window.history.back()} {...restProps}>
		{#if children}
			{@render children()}
		{:else}
			Cancel
		{/if}
	</Button>
{/if}
