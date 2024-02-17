<script lang="ts">
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import type { SvelteComponent } from 'svelte';
	import type { EChartsOptions } from 'svelte-echarts';
	let ChartComponent: typeof SvelteComponent<{ options: EChartsOptions }> | undefined;

	export let options: EChartsOptions;

	onMount(async () => {
		const { Chart } = await import('svelte-echarts');
		ChartComponent = Chart as unknown as typeof SvelteComponent;
	});
</script>

{#if ChartComponent && browser}
	<svelte:component this={ChartComponent} {options} />
{:else}
	<p>Loading...</p>
{/if}
