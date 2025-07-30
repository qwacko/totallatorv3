<script lang="ts">
  import type { EChartsOption } from "echarts";

  import { goto } from "$app/navigation";

  import Chart from "$lib/components/chart/Chart.svelte";
  import type { EChartsBrushSelectedHandler } from "$lib/components/chart/chartable";
  import { filterNullUndefinedAndDuplicates } from "$lib/helpers/filterNullUndefinedAndDuplicates";
  import { urlGenerator } from "$lib/routes";

  const {
    data,
  }: {
    data: { duration: number; time: Date; title: string | null; id: string }[];
  } = $props();

  const minTime = $derived(
    Math.min(...data.map((item) => item.time.getTime())),
  );
  const maxTime = $derived(
    Math.max(...data.map((item) => item.time.getTime())),
  );

  const chartConfig = $derived<EChartsOption>({
    toolbox: {
      feature: {
        brush: {
          type: ["rect", "clear"], // Types of brushes
          title: {
            rect: "Rectangle selection",
            clear: "Clear selection",
          },
        },
      },
    },
    brush: {
      throttleType: "debounce",
      throttleDelay: 100,
      toolbox: ["rect", "clear"],
      xAxisIndex: "all",
      brushLink: "all",
      outOfBrush: {
        colorAlpha: 0.1, // Dim points outside the brush area
      },
    },
    xAxis: {
      show: true,
      boundaryGap: false,
      min: minTime - 5,
      max: maxTime + 5,
    },
    yAxis: {
      show: false,
    },
    grid: {
      left: "10",
      right: "10",
      bottom: "10",
      top: "10",
      containLabel: false,
    },
    tooltip: {
      trigger: "axis",
      formatter: (params) => {
        const item = data[(params as any)[0].dataIndex];
        return `${item.title}<br>${item.duration}ms<br>${item.time.toLocaleString()}.${String(item.time.getMilliseconds()).padStart(3, "0")}`;
      },
    },
    series: [
      {
        data: data.map((item) => [item.time.getTime(), item.duration]),
        type: "scatter",
        animation: false,
        symbolSize: 5,
      },
    ],
  });

  let selectedData = $state<
    Parameters<EChartsBrushSelectedHandler>[0] | undefined
  >(undefined);

  const onBrushSelected: EChartsBrushSelectedHandler = (params) => {
    selectedData = params;
  };

  const onBrushEnd = () => {
    setTimeout(() => {
      if (!selectedData) return;
      const selectedDataIndexes = selectedData.batch
        .map((batch) => batch.selected.map((index) => index.dataIndex))
        .flat()
        .flat();
      let selectedIds: string[] | undefined = filterNullUndefinedAndDuplicates(
        selectedDataIndexes.map((index) => data[index].id),
      );
      if (selectedIds.length == 0) {
        selectedIds = undefined;
      }

      goto(
        urlGenerator({
          address: "/(loggedIn)/queries/list",
          searchParamsValue: { idArray: selectedIds, pageSize: 10, page: 0 },
        }).url,
      );
    }, 200);
  };
</script>

<div class="relative flex h-60 w-full grow self-stretch justify-self-stretch">
  {#if chartConfig}<Chart
      options={chartConfig}
      renderer="svg"
      onClick={(e) => {
        if (e.dataIndex !== undefined) {
          const item = data[e.dataIndex];
          goto(
            urlGenerator({
              address: "/(loggedIn)/queries/list",
              searchParamsValue: { idArray: [item.id], pageSize: 10, page: 0 },
            }).url,
          );
        }
      }}
      {onBrushSelected}
      {onBrushEnd}
    />{/if}
</div>
