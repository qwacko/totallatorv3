<script lang="ts">
	import type { ReportConfigPartWithData_Sparkline } from '$lib/server/db/actions/helpers/report/getData';
	import { Spinner, Badge, Tooltip } from 'flowbite-svelte';
	import { browser } from '$app/environment';
	import Chart from '$lib/components/chart/Chart.svelte';
	import type { EChartsOptions, EChartsSeries } from '$lib/components/chart/chartable';
	import { filterNullUndefinedAndDuplicates } from '$lib/helpers/filterNullUndefinedAndDuplicates';
	import { convertNumberToText } from '$lib/helpers/convertNumberToText';
	import type { currencyFormatType } from '$lib/schema/userSchema';

	export let data: ReportConfigPartWithData_Sparkline;
	export let currency: currencyFormatType = 'USD';

	const updateOptions = ({
		readData
	}: {
		readData: Awaited<ReportConfigPartWithData_Sparkline['data']>;
	}): { errorMessage?: string; options?: EChartsOptions } => {
		if (!browser) {
			return {};
		}

		// options = undefined;
		const resolvedData = readData;

		if ('errorMessage' in resolvedData) {
			return { errorMessage: resolvedData.errorMessage };
		}

		const minValue = Math.min(...resolvedData.data.map((d) => d.value));

		const maxValue = Math.max(...resolvedData.data.map((d) => d.value));

		const areaOrigin = maxValue > 0 && minValue < 0 ? 0 : minValue < 0 ? maxValue : minValue;

		const dataSeries: EChartsSeries =
			data.type === 'sparkline'
				? {
						name: 'Total',
						type: 'line',
						areaStyle: {
							origin: areaOrigin,
							color: {
								type: 'linear',
								x: 0,
								y: 0,
								x2: 0,
								y2: 1,
								colorStops: [
									{
										offset: 0,
										color: 'blue'
									},
									{
										offset: 1,
										color: 'rgba(0, 0, 0, 0)'
									}
								]
							}
						},

						smooth: true,
						data: resolvedData?.data.map((d) => d.value),
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
				: {
						name: 'Total',
						type: 'bar',
						data: resolvedData?.data.map((d) => d.value),
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
				left: '40',
				right: '40',
				bottom: '10',
				top: '10',
				containLabel: false
			},
			xAxis: [
				{
					type: 'category',
					show: false,
					boundaryGap: false,
					data: resolvedData?.data
						? filterNullUndefinedAndDuplicates(resolvedData.data.map((d) => d.time))
						: []
				}
			],
			yAxis: [
				{
					type: 'value',
					show: false,
					min: minValue,
					max: maxValue,
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
			series: dataSeries
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
