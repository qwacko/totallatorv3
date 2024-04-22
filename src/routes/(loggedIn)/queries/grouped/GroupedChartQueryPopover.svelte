<script lang="ts">
	import { Button, Popover } from 'flowbite-svelte';
	import ChartIcon from '$lib/components/icons/ChartIcon.svelte';

	import type { EChartsOption } from 'echarts';
	import Chart from '$lib/components/chart/Chart.svelte';

	export let data: {
		timeBuckets: Record<string, number>;
	};

	let chartConfig: EChartsOption | undefined;

	$: chartConfig = {
		xAxis: {
			type: 'category',
			show: false,
			boundaryGap: false
		},
		yAxis: {
			type: 'value',
			show: false
		},
		grid: {
			left: '10',
			right: '10',
			bottom: '10',
			top: '10',
			containLabel: false
		},
		series: [
			{
				data: Object.values(data.timeBuckets),
				type: 'bar',
				animation: false
			}
		]
	};
</script>

<Button size="xs"><ChartIcon /></Button>
<Popover>
	<div class="relative flex h-60 w-60 grow self-stretch justify-self-stretch">
		{#if chartConfig}<Chart options={chartConfig} renderer="svg" />{/if}
	</div>
</Popover>
