<script lang="ts">
	import type { ReportConfigPartWithData_NonTimeGraph } from '$lib/server/db/actions/helpers/report/getData';
	import { Spinner, Badge, Tooltip } from 'flowbite-svelte';
	import { browser } from '$app/environment';
	import Chart from '$lib/components/chart/Chart.svelte';
	import type { EChartsOptions, OptionsDataFormatter } from '$lib/components/chart/chartable';
	import type { currencyFormatType } from '$lib/schema/userSchema';
	import { currencyFormat } from '$lib/stores/userInfoStore';
	import { convertNumberToText } from '$lib/helpers/convertNumberToText';
	import { groupedDataToTree } from './groupedDataToTree';

	export let data: ReportConfigPartWithData_NonTimeGraph;

	const updateOptions = ({
		readData,
		currencyFormat
	}: {
		readData: Awaited<ReportConfigPartWithData_NonTimeGraph['data']>;
		currencyFormat: currencyFormatType;
	}): { errorMessage?: string; options?: EChartsOptions } => {
		if (!browser) {
			return {};
		}

		// options = undefined;
		const resolvedData = readData;

		if ('errorMessage' in resolvedData) {
			return { errorMessage: resolvedData.errorMessage as string };
		}

		if (!resolvedData || resolvedData.data.length === 0) {
			return { errorMessage: 'No data' };
		}

		const { treeData, pathData } = groupedDataToTree({
			data: resolvedData.data,
			dataGrouping1: data.itemGrouping,
			dataGrouping2: data.itemGrouping2,
			dataGrouping3: data.itemGrouping3,
			dataGrouping4: data.itemGrouping4,
			negativeDisplay: data.negativeDisplay
		});


		const valueFormatter: OptionsDataFormatter = (value) => {
			if (!value) return '';
			return convertNumberToText({
				value: Number(value.valueOf()),
				config: data.numberDisplay,
				currency: currencyFormat
			});
		};

		const tooltipFormatter: (params: any) => string = (params) => {
			const dataPath = params.data.path as string;

			if (dataPath === undefined) {
				return `<div class="flex flex-row gap-5">Up...</div>`;
			}
			const originalValue = pathData[dataPath] || 0;
			const valueString = convertNumberToText({
				value: Number(originalValue.valueOf()),
				config: data.numberDisplay,
				currency: currencyFormat
			});

			return `<div class="flex flex-row gap-5">${dataPath} <div class="font-bold ${originalValue < 0 ? 'text-red-500' : ''}">${valueString}</div></div>`;
		};

		if (data.type === 'pie') {
			const returnConfig: EChartsOptions = {
				tooltip: {
					trigger: 'item',
					valueFormatter
				},
				series: [
					{
						name: 'All',
						type: 'sunburst',
						tooltip: {
							trigger: 'item',
							formatter: tooltipFormatter
						},
						label: {
							show: false
						},
						data: treeData
					}
				]
			};

			return { options: returnConfig };
		}

		if (data.type === 'box') {
			function getLevelOption() {
				return [
					{
						itemStyle: {
							borderWidth: 0,
							gapWidth: 5
						}
					},
					{
						colorSaturation: [0.35, 0.5],
						itemStyle: {
							gapWidth: 1
						}
					},
					{
						colorSaturation: [0.35, 0.5],
						itemStyle: {
							gapWidth: 1,
							borderColorSaturation: 0.6
						}
					}
				];
			}

			const returnConfig: EChartsOptions = {
				tooltip: {
					trigger: 'item',
					valueFormatter,
					formatter: tooltipFormatter
				},
				series: [
					{
						name: 'All',
						type: 'treemap',
						leafDepth: 4,
						itemStyle: {
							borderRadius: 0,
							borderColor: '#fff',
							borderWidth: 0
						},
						label: {
							show: false
						},
						emphasis: {
							focus: 'self'
						},
						labelLine: {
							show: false
						},
						levels: getLevelOption(),
						data: treeData
					}
				]
			};

			return { options: returnConfig };
		}

		return { errorMessage: 'Unknown type' };
	};
</script>

<div class="relative flex grow self-stretch justify-self-stretch">
	{#await data.data}
		<div class="flex h-full w-full place-content-center place-items-center">
			<Spinner />
		</div>
	{:then resolvedData}
		{@const config = updateOptions({ readData: resolvedData, currencyFormat: $currencyFormat })}
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
