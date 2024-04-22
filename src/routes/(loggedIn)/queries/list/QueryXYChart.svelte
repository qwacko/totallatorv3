<script lang="ts">
	import type { EChartsOption } from 'echarts';
	import Chart from '$lib/components/chart/Chart.svelte';

	export let data: { duration: number; time: Date }[];

	let chartConfig: EChartsOption | undefined;

	$: minTime = Math.min(...data.map((item) => item.time.getTime()));
	$: maxTime = Math.max(...data.map((item) => item.time.getTime()));
	$: chartConfig = {
		xAxis: {
			show: true,
			boundaryGap: false
		},
		yAxis: {
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
				data: data.map((item) => [item.time.getTime() - minTime, item.duration]),
				type: 'scatter',
				animation: false,
				symbolSize: 5
			}
		]
	};
</script>

<div class="relative flex h-60 w-full grow self-stretch justify-self-stretch">
	{#if chartConfig}<Chart options={chartConfig} renderer="svg" />{/if}
</div>
