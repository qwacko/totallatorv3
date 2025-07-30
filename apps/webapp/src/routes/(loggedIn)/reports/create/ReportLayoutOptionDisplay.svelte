<script lang="ts">
  import type { ReportLayoutIds } from "@totallator/shared";

  import ReportGridItem from "$lib/components/report/ReportGridItem.svelte";
  import ReportGridWrapper from "$lib/components/report/ReportGridWrapper.svelte";

  import { reportLayoutOptions } from "./reportLayoutOptions";

  const { format }: { format: ReportLayoutIds } = $props();

  const currentConfiguration = $derived(
    (reportLayoutOptions[format] || reportLayoutOptions.default).sort(
      (a, b) => a.order - b.order,
    ),
  );
</script>

<ReportGridWrapper size="xs">
  {#each currentConfiguration as { cols, rows, title }}
    <ReportGridItem {cols} {rows} highlightOnHover>
      {#if title}{title}{/if}
    </ReportGridItem>
    <!-- <div
			class="col-span-2 flex h-full w-full items-center justify-center rounded-lg border border-gray-300 text-center text-gray-400 shadow-md hover:border-gray-500 hover:shadow-lg"
			class:col-span-1={cols === 1}
			class:col-span-2={cols === 2}
			class:col-span-3={cols === 3}
			class:col-span-4={cols === 4}
			class:col-span-5={cols === 5}
			class:col-span-6={cols === 6}
			class:row-span-1={rows === 1}
			class:row-span-2={rows === 2}
			class:row-span-3={rows === 3}
			class:row-span-4={rows === 4}
			class:row-span-5={rows === 5}
			class:row-span-6={rows === 6}
		>
			{#if title}{title}{/if}
		</div> -->
  {/each}
</ReportGridWrapper>
