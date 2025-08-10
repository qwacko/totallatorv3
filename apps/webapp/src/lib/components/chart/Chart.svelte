<script lang="ts">
  import type { EChartsOption } from "echarts";

  import {
    chartable,
    type EChartsBrushEndHandler,
    type EChartsBrushSelectedHandler,
    type EChartsClickHandler,
  } from "./chartable";

  const {
    options,
    theme,
    renderer = "canvas",
    onClick,
    onMouseOut,
    onMouseOver,
    onBrushEnd,
    onBrushSelected,
  }: {
    options: EChartsOption;
    theme?: string;
    renderer?: "canvas" | "svg";
    onClick?: EChartsClickHandler;
    onMouseOut?: EChartsClickHandler;
    onMouseOver?: EChartsClickHandler;
    onBrushEnd?: EChartsBrushEndHandler;
    onBrushSelected?: EChartsBrushSelectedHandler;
  } = $props();
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
    onBrushSelected,
  }}
  aria-roledescription="chart"
></div>

<style>
  .chart {
    height: 100%;
    width: 100%;
  }
</style>
