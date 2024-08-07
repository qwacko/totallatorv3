<script lang="ts">
	import type { EChartsOption } from 'echarts';
	import {
		chartable,
		type EChartsClickHandler,
		type EChartsBrushEndHandler,
		type EChartsBrushSelectedHandler
	} from './chartable';

	export let options: EChartsOption;
	export let theme: string | undefined = undefined;
	export let renderer: 'canvas' | 'svg' = 'canvas';
	export let onClick: EChartsClickHandler | undefined = undefined;
	export let onMouseOut: EChartsClickHandler | undefined = undefined;
	export let onMouseOver: EChartsClickHandler | undefined = undefined;
	export let onBrushEnd: EChartsBrushEndHandler | undefined = undefined;
	export let onBrushSelected: EChartsBrushSelectedHandler | undefined = undefined;
</script>

<div
	class="chart"
	use:chartable={{
		renderer,
		theme,
		options,
		onClick,
		onMouseOut,
		onMouseOver,
		onBrushEnd,
		onBrushSelected
	}}
	aria-roledescription="chart"
></div>

<style>
	.chart {
		height: 100%;
		width: 100%;
	}
</style>
