<script lang="ts">
	import type { EChartsOption } from 'echarts';
	import Chart from '$lib/components/chart/Chart.svelte';
	import { goto } from '$app/navigation';
	import { urlGenerator } from '$lib/routes';

	export let data: { duration: number; time: Date; title: string; id: string }[];

	let chartConfig: EChartsOption | undefined;

	$: minTime = Math.min(...data.map((item) => item.time.getTime()));

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
		tooltip: {
			trigger: 'axis',
			formatter: (params) => {
				const item = data[(params as any)[0].dataIndex];
				return `${item.title}<br>${item.duration}ms<br>${item.time.toLocaleString()}`;
			}
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
	{#if chartConfig}<Chart
			options={chartConfig}
			renderer="svg"
			onClick={(e) => {
				if (e.dataIndex !== undefined) {
                    const item = data[e.dataIndex];
                    goto(urlGenerator({address: "/(loggedIn)/queries/list", searchParamsValue: {idArray: [item.id], pageSize:10, page:0} }).url)
                };
			}}
		/>{/if}
</div>
