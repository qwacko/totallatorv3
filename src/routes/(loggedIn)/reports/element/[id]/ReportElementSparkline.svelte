<script lang="ts">
	import { Chart } from 'flowbite-svelte';
	import type { ApexOptions } from 'apexcharts';
	import type { SingleTimeSeriesData } from '$lib/server/db/actions/helpers/report/getData';
	import { filterNullUndefinedAndDuplicates } from '$lib/helpers/filterNullUndefinedAndDuplicates';
	import { getCurrencyFormatter, type currencyFormatType } from '$lib/schema/userSchema';

	export let data: Awaited<SingleTimeSeriesData>;

	export let format: currencyFormatType = 'USD';
	$: formatter = getCurrencyFormatter(format);

	const updateOptions = (data: Awaited<SingleTimeSeriesData>): ApexOptions => ({
		chart: {
			height: '80%',
			width: '100%',
			type: 'area',
			fontFamily: 'Inter, sans-serif',
			dropShadow: {
				enabled: false
			},
			toolbar: {
				show: false
			}
		},
		tooltip: {
			enabled: true,
			x: {
				show: true
			},
			y: {
				formatter: (val) => formatter.format(val)
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
				left: 2,
				right: 2,
				top: 0
			}
		},
		series: [
			{
				name: 'Amount',
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
	});

	$: options = updateOptions(data);
</script>

<Chart {options} />
