<script lang="ts">
  import { Chart } from "@flowbite-svelte-plugins/chart";
  import type { ApexOptions } from "apexcharts";
  import { Badge, Spinner, Tooltip } from "flowbite-svelte";
  import { untrack } from "svelte";

  import type { ReportConfigPartWithData_Sparkline } from "@totallator/business-logic";

  import { browser } from "$app/environment";

  import { filterNullUndefinedAndDuplicates } from "$lib/helpers/filterNullUndefinedAndDuplicates";

  const {
    data,
    class: className = "",
  }: { data: ReportConfigPartWithData_Sparkline; class?: string } = $props();

  const type: "area" | "bar" =
    data.type === "sparkline"
      ? "area"
      : data.type === "sparklinebar"
        ? "bar"
        : "area";

  let width = $state<number | undefined>();
  let height = $state<number | undefined>();

  let options = $state<ApexOptions | undefined>(undefined);
  let errorMessage = $state<string | undefined>();

  const updateOptions = async (
    data: ReportConfigPartWithData_Sparkline["data"],
    width: number,
    height: number,
  ): Promise<void> => {
    if (!browser) {
      return;
    }
    errorMessage = undefined;

    options = undefined;
    const resolvedData = await data;

    if ("errorMessage" in resolvedData) {
      errorMessage = resolvedData.errorMessage;
      return;
    }

    options = {
      chart: {
        height: `${height}px`,
        width: `${width}px`,
        sparkline: {
          enabled: true,
        },
        type,
        fontFamily: "Inter, sans-serif",
        dropShadow: {
          enabled: false,
        },
        toolbar: {
          show: false,
        },
        animations: {
          enabled: false,
        },
      },
      tooltip: {
        enabled: true,
        x: {
          show: true,
        },
        y: {
          formatter: (val) => {
            return (
              resolvedData.data.find((d) => d.value === val)?.textValue ||
              val.toString()
            );
          },
        },
      },
      fill: {
        type: "gradient",
        gradient: {
          opacityFrom: 0.55,
          opacityTo: 0,
          shade: "#1C64F2",
          gradientToColors: ["#1C64F2"],
        },
      },
      dataLabels: {
        enabled: false,
      },
      stroke: {
        width: 1,
      },
      grid: {
        show: false,
        strokeDashArray: 4,
        padding: {
          left: 0,
          right: 0,
          top: 0,
        },
      },
      series: [
        {
          name: resolvedData.title,
          data: resolvedData.data.map((d) => d.value),
          color: "#1A56DB",
        },
      ],

      xaxis: {
        categories: resolvedData
          ? filterNullUndefinedAndDuplicates(
              resolvedData.data.map((d) => d.time),
            )
          : [],
        labels: {
          show: false,
        },
        axisBorder: {
          show: false,
        },
        axisTicks: {
          show: false,
        },
        tooltip: {
          enabled: false,
        },
      },
      yaxis: {
        show: false,
      },
    };
  };

  $effect(() => {
    untrack(() => updateOptions)(data.data, width || 0, height || 0);
  });
</script>

<div
  class="relative flex grow self-stretch"
  bind:clientWidth={width}
  bind:clientHeight={height}
>
  {#if errorMessage}
    <Badge color="red">Error</Badge>
    <Tooltip>{errorMessage}</Tooltip>
  {:else if width > 0 && height > 0}
    {#if options}
      {#key `${width}-${height}`}
        <Chart {options} class="absolute {className}" />
      {/key}
    {:else}
      <div class="flex h-full w-full place-content-center place-items-center">
        <Spinner />
      </div>
    {/if}
  {/if}
</div>
