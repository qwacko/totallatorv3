import type { JournalSummaryType } from '$lib/server/db/actions/journalActions';
import type { getCurrencyFormatter } from '$lib/schema/userSchema';
import type { ChartProps } from 'flowbite-svelte/dist/charts/Chart.svelte';
import type { SummaryItemDetailsType } from '$lib/schema/summaryCacheSchema';

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

export const generatePIChartConfig = ({
	data,
	formatter,
	height,
	title,
	removeNull = true,
	onClick
}: {
	data: SummaryItemDetailsType[];
	formatter: ReturnType<typeof getCurrencyFormatter>;
	height: string;
	title: string;
	removeNull?: boolean;
	onClick?: (id: string | null | undefined) => Promise<unknown>;
}): ChartProps => {
	const sortedData = data
		.sort((a, b) => b.sum - a.sum)
		.filter((item) => item.sum !== 0)
		.filter((item) => !removeNull || !(item.id === null || item.id === undefined));
	const numberItems = data.length;
	const showLabels = numberItems <= 8;

	return {
		options: {
			chart: {
				type: 'bar',
				height,
				animations: {
					enabled: false
				},
				events: {
					markerClick: async (_1, _2, clickData) => {
						const clickedData = sortedData[clickData.dataPointIndex];
						const clickedId = clickedData.id;

						if (onClick) {
							await onClick(clickedId);
						}
					}
				}
			},
			dataLabels: {
				formatter: (val) => formatter.format(Number(val)),
				enabled: showLabels
			},
			plotOptions: {
				bar: {
					horizontal: false
				}
			},
			series: [
				{
					data: sortedData.map((item) => ({
						x: item.title ? item.title : `No ${title}`,
						y: item.sum
					})),
					name: 'Total'
				}
			],
			tooltip: {
				shared: true,
				intersect: false,
				y: {
					formatter: (val) => formatter.format(val)
				}
			},
			xaxis: {
				labels: { show: false }
			},
			yaxis: {
				labels: {
					formatter: (val) => formatter.format(val)
				}
			}
		}
	};
};
