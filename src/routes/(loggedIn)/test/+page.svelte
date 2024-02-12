<script lang="ts">
	import type { EChartsOption } from 'echarts';
	import TestChart from '../../../lib/components/chart/Chart.svelte';

	const optionsA: EChartsOption = {
		xAxis: {
			data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
			type: 'category'
		},
		yAxis: {
			type: 'value'
		},
		series: [
			{
				data: [820, 932, 901, 934, 1290, 1330, 1200],
				type: 'bar'
			}
		]
	};

	const optionsB: EChartsOption = {
		xAxis: {
			data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
			type: 'category'
		},
		yAxis: {
			type: 'value'
		},
		series: [
			{
				data: [720, 932, 901, 934, 1290, 1330, 1200],
				type: 'line'
			}
		]
	};

	let options: EChartsOption = optionsA;
</script>

<button on:click={() => (options = optionsA)}>Bar</button>
<button on:click={() => (options = optionsB)}>Line</button>
<div class="h-48 w-48">
	<TestChart {options} />
</div>
