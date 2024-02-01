<script lang="ts">
	export let showLayout: boolean;
	export let href: string | undefined;
	export let highlight: boolean = false;
</script>

{#if href}
	<a
		{href}
		class="min-h-2 min-w-2 {$$props.class}"
		class:bg-gray-100={highlight}
		class:border={showLayout}
		class:hover:bg-gray-200={showLayout}
		class:hover:shadow-xl={showLayout}
		data-sveltekit-noscroll
	>
		<slot />
	</a>
{:else}
	<div
		class="min-h-2 min-w-2 {$$props.class}"
		class:bg-gray-100={highlight}
		class:border={showLayout}
		class:hover:bg-gray-200={showLayout}
		class:hover:shadow-xl={showLayout}
	>
		<slot />
	</div>
{/if}
