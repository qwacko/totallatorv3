<script lang="ts">
	import type { EChartsOption } from 'echarts';
	import { chartable, type EChartsClickHandler } from './chartable';

	export let options: EChartsOption;
	export let theme: string | undefined = undefined;
	export let renderer: 'canvas' | 'svg' = 'canvas';
	export let onClick: EChartsClickHandler | undefined = undefined;
	export let onMouseOut: EChartsClickHandler | undefined = undefined;
	export let onMouseOver: EChartsClickHandler | undefined = undefined;
</script>

<div
	class="chart"
	use:chartable={{
		renderer,
		theme,
		options,
		onClick,
		onMouseOut,
		onMouseOver
	}}
	aria-roledescription="chart"
/>

<style>
	.chart {
		height: 100%;
		width: 100%;
	}
</style>
