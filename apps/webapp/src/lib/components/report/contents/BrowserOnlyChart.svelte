<script lang="ts">
	import type { EChartsOption } from 'echarts';
	import { onMount } from 'svelte';
	import type { SvelteComponent } from 'svelte';

	import { browser } from '$app/environment';

	let ChartComponent = $state<typeof SvelteComponent<{ options: EChartsOption }> | undefined>();

	const { options }: { options: EChartsOption } = $props();

	onMount(async () => {
		const { Chart } = await import('svelte-echarts');
		ChartComponent = Chart as unknown as typeof SvelteComponent;
	});
</script>

{#if ChartComponent && browser}
	<ChartComponent {options} />
{:else}
	<p>Loading...</p>
{/if}
