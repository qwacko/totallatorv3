<script lang="ts">
	import { Chart } from 'flowbite-svelte';
	import type { ApexOptions } from 'apexcharts';
	import type { SingleTimeSeriesData } from '$lib/server/db/actions/helpers/report/getData';
	import { filterNullUndefinedAndDuplicates } from '$lib/helpers/filterNullUndefinedAndDuplicates';
	import { getCurrencyFormatter } from '$lib/schema/userSchema';
	import type { DisplaySparklineOptionsDataType } from '$lib/schema/reportHelpers/displaySparklineOptionsEnum';

	export let data: Awaited<SingleTimeSeriesData>;
	export let config: DisplaySparklineOptionsDataType[keyof DisplaySparklineOptionsDataType];

	$: type = config.id === 'none' ? 'area' : config.graphType;
	$: typeIsCount = config.id === 'none' || config.type === 'count';
	$: displayIsRunningTotal = config.id === 'none' || config.runningTotal;

	let width: number | undefined;
	let height: number | undefined;

	$: formatter = typeIsCount ? undefined : getCurrencyFormatter('USD');

	const updateOptions = (
		data: Awaited<SingleTimeSeriesData>,
		width: number,
		height: number
	): ApexOptions => {
		// console.log(`width: ${width}, height: ${height}`);

		return {
			chart: {
				height: `${height}px`,
				width: `${width}px`,
				sparkline: {
					enabled: true
				},
				type,
				fontFamily: 'Inter, sans-serif',
				dropShadow: {
					enabled: false
				},
				toolbar: {
					show: false
				},

				animations: {
					enabled: false
				}
			},
			tooltip: {
				enabled: true,
				x: {
					show: true
				},
				y: {
					formatter: (val) => {
						return formatter ? formatter.format(val) : val.toString();
					}
				}
			},
			fill: {
				type: 'gradient',
				gradient: {
					opacityFrom: 0.55,
					opacityTo: 0,
					shade: '#1C64F2',
					gradientToColors: ['#1C64F2']
				}
			},
			dataLabels: {
				enabled: false
			},
			stroke: {
				width: 1
			},
			grid: {
				show: false,
				strokeDashArray: 4,
				padding: {
					left: 0,
					right: 0,
					top: 0
				}
			},
			series: [
				{
					name: typeIsCount ? (displayIsRunningTotal ? 'Total Count' : 'Count') : 'Amount',
					data: data ? filterNullUndefinedAndDuplicates(data.map((d) => Number(d.amount))) : [],
					color: '#1A56DB'
				}
			],
			xaxis: {
				categories: data ? filterNullUndefinedAndDuplicates(data.map((d) => d.x)) : [],
				labels: {
					show: false
				},
				axisBorder: {
					show: false
				},
				axisTicks: {
					show: false
				},
				tooltip: {
					enabled: false
				}
			},
			yaxis: {
				show: false
			}
		};
	};

	$: options = updateOptions(data, width || 0, height || 0);
</script>

<div class="relative flex grow self-stretch" bind:clientWidth={width} bind:clientHeight={height}>
	{#if width > 0 && height > 0}
		<Chart {options} class="absolute {$$props.class}" key={`${width}-${height}`} />
	{/if}
</div>
