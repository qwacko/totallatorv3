<script lang="ts">
	import type { ReportConfigPartWithData_TimeGraph } from '$lib/server/db/actions/helpers/report/getData';
	import { Spinner, Badge, Tooltip } from 'flowbite-svelte';
	import { browser } from '$app/environment';
	import Chart from '$lib/components/chart/Chart.svelte';
	import type { EChartsOptions, EChartsSeries } from '$lib/components/chart/chartable';
	import { filterNullUndefinedAndDuplicates } from '$lib/helpers/filterNullUndefinedAndDuplicates';
	import { convertNumberToText } from '$lib/helpers/convertNumberToText';
	import type { currencyFormatType } from '$lib/schema/userSchema';

	export let data: ReportConfigPartWithData_TimeGraph;
	export let currency: currencyFormatType = 'USD';

	let width = 0;
	let height = 0;

	// const type: 'area' | 'bar' =
	// 	data.type === 'time_line' ? 'area' : data.type === 'time_stackedArea' ? 'area' : 'area';

	$: showXAxis = height > 300;
	$: showYAxis = width > 800;

	$: dynamicConfig = {
		showXAxis,
		showYAxis
	};

	const updateOptions = ({
		readData,
		showXAxis = true,
		showYAxis = true
	}: {
		readData: Awaited<ReportConfigPartWithData_TimeGraph['data']>;
		showXAxis?: boolean;
		showYAxis?: boolean;
	}): { errorMessage?: string; options?: EChartsOptions } => {
		if (!browser) {
			return {};
		}

		// options = undefined;
		const resolvedData = readData;

		if ('errorMessage' in resolvedData) {
			return { errorMessage: resolvedData.errorMessage };
		}

		const totalSeries: EChartsSeries = {
			name: 'Total',
			type: 'line',
			color: 'black',
			lineStyle: {
				type: 'dotted'
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
		};

		const bothAxisVisible = showXAxis && showYAxis;

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
			toolbox: {
				feature: {
					saveAsImage: {},
					dataView: {},
					dataZoom: {}
				}
			},
			grid: {
				left: bothAxisVisible ? '3%' : showYAxis ? '100' : '0%',
				right: '10',
				bottom: bothAxisVisible ? '3%' : showXAxis ? '30' : '0%',
				top: '10',
				containLabel: bothAxisVisible
			},
			xAxis: [
				{
					type: 'category',
					show: showXAxis,
					boundaryGap: false,
					data: resolvedData?.data[0].data
						? filterNullUndefinedAndDuplicates(resolvedData.data[0].data.map((d) => d.time))
						: []
				}
			],
			yAxis: [
				{
					type: 'value',
					show: showYAxis,
					axisLabel: {
						formatter: (value) => {
							return convertNumberToText({
								value: Number(value.valueOf()),
								config: data.numberDisplay,
								currency
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
				...(data.includeTotal ? [totalSeries] : [])
			]
		};

		return { options: returnConfig };
	};
</script>

<div
	class="relative flex grow self-stretch justify-self-stretch"
	bind:clientWidth={width}
	bind:clientHeight={height}
>
	{#await data.data}
		<div class="flex h-full w-full place-content-center place-items-center">
			<Spinner />
		</div>
	{:then resolvedData}
		{@const config = updateOptions({ readData: resolvedData, ...dynamicConfig })}
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
