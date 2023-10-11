import type { JournalSummaryType } from '$lib/server/db/actions/journalActions';
import type { getCurrencyFormatter } from '$lib/schema/userSchema';
import type { ChartProps } from 'flowbite-svelte/dist/charts/Chart.svelte';

export const generateTotalTrendConfig = ({
	data,
	formatter,
	height,
	onYearMonthClick
}: {
	data: JournalSummaryType['monthlySummary'];
	formatter: ReturnType<typeof getCurrencyFormatter>;
	height: string;
	onYearMonthClick?: (yearMonth: string) => void;
}): ChartProps => ({
	options: {
		chart: {
			height,
			type: 'area',
			fontFamily: 'Inter, sans-serif',
			dropShadow: {
				enabled: false
			},
			toolbar: {
				show: false
			},
			animations: {
				enabled: false
			},
			events: {
				markerClick: function (_1, _2, { dataPointIndex }) {
					const matchingData = data[dataPointIndex];
					if (matchingData && onYearMonthClick) {
						onYearMonthClick(matchingData.yearMonth);
					}
				}
			}
		},
		tooltip: {
			enabled: true,
			x: {
				show: false
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
			width: 2
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
				name: 'Total',
				data: data.map((item) => ({ x: item.yearMonth, y: item.runningTotal })),
				color: '#1A56DB'
			}
		],
		xaxis: {
			categories: data.map((item) => item.yearMonth),
			labels: {
				show: false
			},
			axisBorder: {
				show: false
			},
			axisTicks: {
				show: false
			}
		},
		yaxis: {
			show: false
		}
	}
});

export const generateFlowTrendConfig = ({
	data,
	formatter,
	height,
	onYearMonthClick
}: {
	data: JournalSummaryType['monthlySummary'];
	formatter: ReturnType<typeof getCurrencyFormatter>;
	height: string;
	onYearMonthClick?: (yearMonth: string) => void;
}): ChartProps => ({
	options: {
		series: [
			{
				name: 'Inflow',
				color: '#31C48D',
				data: data.map((item) => item.positiveSum),
				type: 'column'
			},
			{
				name: 'Outflow',
				data: data.map((item) => item.negativeSum),
				color: '#F05252',
				type: 'column'
			},
			{
				name: 'Sum',
				data: data.map((item) => item.sum),
				color: 'black',
				type: 'line'
			}
		],

		chart: {
			width: '100%',
			height,
			toolbar: {
				show: false
			},
			animations: {
				enabled: false
			},
			events: {
				markerClick: function (_1, _2, { dataPointIndex }) {
					const matchingData = data[dataPointIndex];
					if (matchingData && onYearMonthClick) {
						onYearMonthClick(matchingData.yearMonth);
					}
				}
			}
		},
		plotOptions: {
			bar: {
				horizontal: false,
				columnWidth: '100%'
			}
		},
		legend: {
			show: false,
			position: 'bottom'
		},
		dataLabels: {
			enabled: false
		},
		stroke: {
			width: 2
		},
		tooltip: {
			shared: true,
			intersect: false,
			y: {
				formatter: (val) => formatter.format(val)
			}
		},
		yaxis: {
			labels: { show: false }
		},
		xaxis: {
			categories: data.map((item) => item.yearMonth),
			labels: {
				show: false,
				style: {
					fontFamily: 'Inter, sans-serif',
					cssClass: 'text-xs font-normal fill-gray-500 dark:fill-gray-400'
				}
			}
		}
	}
});
