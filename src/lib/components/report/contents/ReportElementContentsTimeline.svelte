<script lang="ts">
	import type { ReportConfigPartWithData_TimeGraph } from '$lib/server/db/actions/helpers/report/getData';
	import { Spinner, Badge, Tooltip } from 'flowbite-svelte';
	import { browser } from '$app/environment';
	import Chart from '$lib/components/chart/Chart.svelte';
	import type {
		EChartsOptions,
		EChartsSeries,
		OptionsDataFormatter
	} from '$lib/components/chart/chartable';
	import { filterNullUndefinedAndDuplicates } from '$lib/helpers/filterNullUndefinedAndDuplicates';
	import { convertNumberToText } from '$lib/helpers/convertNumberToText';
	import type { currencyFormatType } from '$lib/schema/userSchema';
	import { currencyFormat } from '$lib/stores/userInfoStore';

	const { data }: { data: ReportConfigPartWithData_TimeGraph } = $props();

	let width = $state(0);
	let height = $state(0);

	const showXAxis = $derived(height > 300);
	const showYAxis = $derived(width > 800);

	const dynamicConfig = $derived({
		showXAxis,
		showYAxis
	});

	const updateOptions = ({
		readData,
		showXAxis = true,
		showYAxis = true,
		currencyFormat
	}: {
		readData: Awaited<ReportConfigPartWithData_TimeGraph['data']>;
		showXAxis?: boolean;
		showYAxis?: boolean;
		currencyFormat: currencyFormatType;
	}): { errorMessage?: string; options?: EChartsOptions } => {
		if (!browser) {
			return {};
		}

		// options = undefined;
		const resolvedData = readData;

		if ('errorMessage' in resolvedData) {
			return { errorMessage: resolvedData.errorMessage };
		}

		const stackedArea = data.type === 'time_stackedArea';
		const bar = data.type === 'time_bar';

		const valueFormatter: OptionsDataFormatter = (value) => {
			if (value) {
				return convertNumberToText({
					value: Number(value.valueOf()),
					config: data.numberDisplay,
					currency: currencyFormat
				});
			}
			return '';
		};

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
				valueFormatter
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
				left: bothAxisVisible ? '3%' : showYAxis ? '100' : '10',
				right: '10',
				bottom: bothAxisVisible ? '3%' : showXAxis ? '30' : '10',
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
						formatter: valueFormatter
					}
				}
			],
			series: [
				...resolvedData.data.map((currentGroup) => {
					if (bar) {
						const returnData = {
							name: currentGroup.group,
							type: 'bar',
							data: currentGroup.data.map((d) => d.value),
							stack: stackedArea ? 'Total' : undefined,
							tooltip: {
								valueFormatter
							},
							emphasis: {
								focus: 'series'
							}
						} satisfies EChartsSeries;

						return returnData;
					}
					const returnData = {
						name: currentGroup.group,
						type: 'line',
						data: currentGroup.data.map((d) => d.value),
						stack: stackedArea ? 'Total' : undefined,
						tooltip: {
							valueFormatter
						},
						areaStyle: stackedArea ? {} : undefined,
						emphasis: {
							focus: 'series'
						}
					} satisfies EChartsSeries;
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
		{@const config = updateOptions({
			readData: resolvedData,
			currencyFormat: $currencyFormat,
			...dynamicConfig
		})}
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
