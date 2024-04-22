import type { EChartsOption, ECharts, ECElementEvent } from 'echarts';
import { browser } from '$app/environment';

export type EChartsOptions = EChartsOption;
export type EChartsSeries = EChartsOption['series'];
export type EChartsTheme = string | object;
export type EChartsRenderer = 'canvas' | 'svg';
export type OptionsDataFormatter = (
	value: null | undefined | string | number | Date | (null | undefined | string | number | Date)[],
	dataIndex: number
) => string;
export type EChartsClickHandler = (params: ECElementEvent) => void;

export type ChartOptions = {
	theme?: EChartsTheme;
	renderer?: EChartsRenderer;
	options: EChartsOptions;
	onClick?: EChartsClickHandler;
	onMouseOver?: EChartsClickHandler;
	onMouseOut?: EChartsClickHandler;
};

const DEFAULT_OPTIONS: Partial<ChartOptions> = {
	theme: undefined,
	renderer: 'canvas'
};

export function chartable(element: HTMLElement, echartOptions: ChartOptions) {
	let echartsInstance: ECharts | undefined;
	let clickHandler: EChartsClickHandler | undefined = echartOptions.onClick;
	let mouseOverHandler: EChartsClickHandler | undefined = echartOptions.onMouseOver;
	let mouseOutHandler: EChartsClickHandler | undefined = echartOptions.onMouseOut;

	async function loadAndInitializeEcharts() {
		if (!browser) return;

		const { init } = await import('echarts');

		const { theme, renderer, options } = {
			...DEFAULT_OPTIONS,
			...echartOptions
		};
		echartsInstance = init(element, theme, { renderer });
		echartsInstance.setOption(options);

		echartsInstance.on('click', function (params) {
			// printing data name in console
			clickHandler && clickHandler(params);
		});
		echartsInstance.on('mouseover', function (params) {
			mouseOverHandler && mouseOverHandler(params);
		});
		echartsInstance.on('mouseout', function (params) {
			mouseOutHandler && mouseOutHandler(params);
		});

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
			if (newOptions.onClick) {
				clickHandler = newOptions.onClick;
			}
			if (newOptions.onMouseOver) {
				mouseOverHandler = newOptions.onMouseOver;
			}
			if (newOptions.onMouseOut) {
				mouseOutHandler = newOptions.onMouseOut;
			}
		}
	};
}
