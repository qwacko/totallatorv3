<script lang="ts">
	import type { ReportConfigPartWithData_TimeGraph } from '$lib/server/db/actions/helpers/report/getData';
	import { Chart, Spinner, Badge, Tooltip } from 'flowbite-svelte';
	import type { ApexOptions } from 'apexcharts';
	import { browser } from '$app/environment';
	import { convertNumberToText } from '$lib/helpers/convertNumberToText';
	import { filterNullUndefinedAndDuplicates } from '$lib/helpers/filterNullUndefinedAndDuplicates';

	export let data: ReportConfigPartWithData_TimeGraph;

	const type: 'area' | 'bar' =
		data.type === 'time_line' ? 'area' : data.type === 'time_stackedArea' ? 'area' : 'area';

	let width: number | undefined;
	let height: number | undefined;

	let options: ApexOptions | undefined = undefined;
	let errorMessage: string | undefined;

	const updateOptions = async (
		readData: ReportConfigPartWithData_TimeGraph['data'],
		width: number,
		height: number
	): Promise<void> => {
		if (!browser) {
			return;
		}

		errorMessage = undefined;

		options = undefined;
		const resolvedData = await readData;

		if ('errorMessage' in resolvedData) {
			errorMessage = resolvedData.errorMessage;
			return;
		}

		options = {
			chart: {
				height: `${height}px`,
				width: `${width}px`,
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
				},

				stacked: true
			},
			legend: {
				show: false
			},
			tooltip: {
				enabled: true,
				x: {
					show: true
				},
				y: {
					formatter: (val) => {
						return convertNumberToText({ value: val, config: data.numberDisplay, currency: 'USD' });
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
			series: resolvedData?.data.map((currentGroup) => ({
				name: currentGroup.group,
				data: currentGroup.data.map((d) => d.value)
			})),
			xaxis: {
				categories: resolvedData?.data[0].data
					? filterNullUndefinedAndDuplicates(resolvedData.data[0].data.map((d) => d.time))
					: [],
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

	$: updateOptions(data.data, width || 0, height || 0);
	$: console.log(`Size : ${width} x ${height}`);
</script>

<div
	class="relative flex grow self-stretch justify-self-stretch bg-red-200"
	bind:clientWidth={width}
	bind:clientHeight={height}
>
	{#if errorMessage}
		<Badge color="red">Error</Badge>
		<Tooltip>{errorMessage}</Tooltip>
	{:else if width > 0 && height > 0}
		{#if options}
			<Chart {options} class="absolute {$$props.class}" key={`${width}-${height}`} />
		{:else}
			<div class="flex h-full w-full place-content-center place-items-center">
				<Spinner />
			</div>
		{/if}
	{/if}
</div>
