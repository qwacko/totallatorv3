<script lang="ts">
	import { Chart, Spinner } from 'flowbite-svelte';
	import type { ApexOptions } from 'apexcharts';
	import type { ReportConfigPartWithData_Sparkline } from '$lib/server/db/actions/helpers/report/getData';
	import { filterNullUndefinedAndDuplicates } from '$lib/helpers/filterNullUndefinedAndDuplicates';
	import { browser } from '$app/environment';

	export let data: ReportConfigPartWithData_Sparkline;

	const type: 'area' | 'bar' =
		data.type === 'sparkline' ? 'area' : data.type === 'sparklinebar' ? 'bar' : 'area';

	let width: number | undefined;
	let height: number | undefined;

	let options: ApexOptions | undefined = undefined;
	let errorMessage: string | undefined;

	const updateOptions = async (
		data: ReportConfigPartWithData_Sparkline['data'],
		width: number,
		height: number
	): Promise<void> => {
		if (!browser) {
			return;
		}
		errorMessage = undefined;

		options = undefined;
		const resolvedData = await data;

		// console.log('Resolved data: ', resolvedData);

		if ('errorMessage' in resolvedData) {
			errorMessage = resolvedData.errorMessage;
			return;
		}

		options = {
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
						return resolvedData.data.find((d) => d.value === val)?.textValue || val.toString();
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
					name: resolvedData.title,
					data: resolvedData.data.map((d) => d.value),
					color: '#1A56DB'
				}
			],
			xaxis: {
				categories: resolvedData
					? filterNullUndefinedAndDuplicates(resolvedData.data.map((d) => d.time))
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
</script>

<div class="relative flex grow self-stretch" bind:clientWidth={width} bind:clientHeight={height}>
	{#if errorMessage}
		<div class="flex h-full w-full place-content-center place-items-center">
			<p class="text-red-500">{errorMessage}</p>
		</div>
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
