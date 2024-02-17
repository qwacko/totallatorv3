import type { EChartsOption, ECharts } from 'echarts';
import { browser } from '$app/environment';

export type EChartsOptions = EChartsOption;
export type EChartsSeries = EChartsOption['series'];
export type EChartsTheme = string | object;
export type EChartsRenderer = 'canvas' | 'svg';
export type OptionsDataFormatter = (
	value: string | number | Date | (string | number | Date)[]
) => string;

export type ChartOptions = {
	theme?: EChartsTheme;
	renderer?: EChartsRenderer;
	options: EChartsOptions;
};

const DEFAULT_OPTIONS: Partial<ChartOptions> = {
	theme: undefined,
	renderer: 'canvas'
};

export function chartable(element: HTMLElement, echartOptions: ChartOptions) {
	let echartsInstance: ECharts | undefined;

	async function loadAndInitializeEcharts() {
		if (!browser) return;

		const { init } = await import('echarts');

		const { theme, renderer, options } = {
			...DEFAULT_OPTIONS,
			...echartOptions
		};
		echartsInstance = init(element, theme, { renderer });
		echartsInstance.setOption(options);

		window.addEventListener('resize', handleResize);
	}

	loadAndInitializeEcharts();

	function handleResize() {
		if (!echartsInstance) return;
		echartsInstance.resize();
	}
	return {
		destroy() {
			if (echartsInstance) {
				echartsInstance.dispose();
			}
			if (browser) {
				window.removeEventListener('resize', handleResize);
			}
		},
		update(newOptions: ChartOptions) {
			if (!echartsInstance) return;
			echartsInstance.setOption({
				...echartOptions.options,
				...newOptions.options
			});
		}
	};
}
