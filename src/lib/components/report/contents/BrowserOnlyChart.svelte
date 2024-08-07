<script lang="ts">
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import type { SvelteComponent } from 'svelte';
	import type { EChartsOption } from 'echarts';
	let ChartComponent: typeof SvelteComponent<{ options: EChartsOption }> | undefined;

	export let options: EChartsOption;

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
