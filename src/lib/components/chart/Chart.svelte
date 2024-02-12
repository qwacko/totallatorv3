<script lang="ts">
	import type { EChartsOption } from 'echarts';
	import { chartable } from './chartable';

	export let options: EChartsOption;
	export let theme: string | undefined = undefined;
	export let renderer: 'canvas' | 'svg' = 'canvas';
</script>

<div class="chart" use:chartable={{ renderer, theme, options }} />

<style>
	.chart {
		height: 100%;
		width: 100%;
	}
</style>
