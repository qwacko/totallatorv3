import type { JournalSummaryType } from '$lib/server/db/actions/journalActions';
import type { getCurrencyFormatter } from '$lib/schema/userSchema';
import type { ChartProps } from 'flowbite-svelte/dist/charts/Chart.svelte';

export const generateTotalTrendConfig = ({
	data,
	formatter
}: {
	data: JournalSummaryType['monthlySummary'];
	formatter: ReturnType<typeof getCurrencyFormatter>;
}): ChartProps => ({
	options: {
		chart: {
			height: '100%',
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
