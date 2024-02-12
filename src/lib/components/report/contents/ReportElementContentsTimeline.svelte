<script lang="ts">
	import type { ReportConfigPartWithData_TimeGraph } from '$lib/server/db/actions/helpers/report/getData';
	import { Spinner, Badge, Tooltip } from 'flowbite-svelte';
	import { browser } from '$app/environment';
	import Chart from '$lib/components/chart/Chart.svelte';
	import type { EChartsOptions, EChartsSeries } from '$lib/components/chart/chartable';
	import { filterNullUndefinedAndDuplicates } from '$lib/helpers/filterNullUndefinedAndDuplicates';
	import { convertNumberToText } from '$lib/helpers/convertNumberToText';

	export let data: ReportConfigPartWithData_TimeGraph;

	// const type: 'area' | 'bar' =
	// 	data.type === 'time_line' ? 'area' : data.type === 'time_stackedArea' ? 'area' : 'area';

	const updateOptions = ({
		readData
	}: {
		readData: Awaited<ReportConfigPartWithData_TimeGraph['data']>;
	}): { errorMessage?: string; options?: EChartsOptions } => {
		if (!browser) {
			return {};
		}

		// options = undefined;
		const resolvedData = readData;

		if ('errorMessage' in resolvedData) {
			return { errorMessage: resolvedData.errorMessage };
		}

		const returnConfig: EChartsOptions = {
			animation: false,
			tooltip: {
				trigger: 'axis',
				order: 'valueDesc',
				axisPointer: {
					type: 'cross',
					label: {
						backgroundColor: '#6a7985'
					}
				}
			},
			// legend: {
			// 	data: ['Email', 'Union Ads', 'Video Ads', 'Direct', 'Search Engine']
			// },
			toolbox: {
				feature: {
					saveAsImage: {},
					dataView: {},
					dataZoom: {}
				}
			},
			grid: {
				left: '3%',
				right: '4%',
				bottom: '3%',
				containLabel: true
			},
			xAxis: [
				{
					type: 'category',
					boundaryGap: false,
					data: resolvedData?.data[0].data
						? filterNullUndefinedAndDuplicates(resolvedData.data[0].data.map((d) => d.time))
						: []
				}
			],
			yAxis: [
				{
					type: 'value',
					axisLabel: {
						formatter: (value) => {
							return convertNumberToText({
								value: Number(value.valueOf()),
								config: data.numberDisplay,
								currency: 'USD'
							});
						}
					}
				}
			],
			series: [
				...resolvedData?.data.map((currentGroup) => {
					const returnData: EChartsSeries = {
						name: currentGroup.group,
						type: 'line',
						data: currentGroup.data.map((d) => d.value),
						stack: 'Total',
						tooltip: {
							valueFormatter: (value) => {
								return convertNumberToText({
									value: Number(value.valueOf()),
									config: data.numberDisplay,
									currency: 'USD'
								});
							}
						},
						areaStyle: {},
						emphasis: {
							focus: 'series'
						}
					};
					return returnData;
				}),
				{
					name: 'Total',
					type: 'line',
					lineStyle: {
						type: 'dotted',
						width: 4
					},
					data: resolvedData?.data[0].data
						.map((_, i) => i)
						.map((_, i) =>
							resolvedData?.data
								.map((currentGroup) => currentGroup.data[i].value)
								.reduce((a, b) => a + b)
						),
					tooltip: {
						valueFormatter: (value) => {
							return convertNumberToText({
								value: Number(value.valueOf()),
								config: data.numberDisplay,
								currency: 'USD'
							});
						}
					}
				}
			]
		};

		return { options: returnConfig };
	};
</script>

<div class="relative flex grow self-stretch justify-self-stretch">
	{#await data.data}
		<div class="flex h-full w-full place-content-center place-items-center">
			<Spinner />
		</div>
	{:then resolvedData}
		{@const config = updateOptions({ readData: resolvedData })}
		{#if config.errorMessage}
			<Badge color="red">Error</Badge>
			<Tooltip>{config.errorMessage}</Tooltip>
		{:else if config.options}
			<Chart options={config.options} />
		{/if}
	{:catch error}
		<Badge color="red">Error</Badge>
		<Tooltip>{error.message}</Tooltip>
	{/await}
</div>
