import { type SQL } from 'drizzle-orm';

import type { DBType } from '@totallator/database';
import type { JournalFilterSchemaWithoutPaginationType } from '@totallator/shared';
import type {
	ReportConfigPartIndividualSchemaType,
	ReportConfigPartSchemaNonTimeGraphType,
	ReportConfigPartSchemaNumberCurrencyType,
	ReportConfigPartSchemaSparklineType,
	ReportConfigPartSchemaStringType,
	ReportConfigPartSchemaTimeGraphType
} from '@totallator/shared';
import type { currencyFormatType } from '@totallator/shared';

import { type DBDateRangeType, filtersToDateRange } from './filtersToDateRange';
import {
	ConfigFilters,
	getCombinedFilters,
	type GetDataForFilterKeyType
} from './getCombinedFilters';
import { groupedMathConfigToNumber } from './groupedMathConfigToNumber';
import { mathConfigToNumber } from './mathConfigToNumber';
import { sparklineConfigToData } from './sparklineConfigToData';
import { stringConfigToString } from './stringConfigToString';
import { timelineConfigToData } from './timelineConfigToData';

export const getItemData = ({
	db,
	config,
	filters,
	commonFilters,
	dbDateRange,
	currency
}: {
	db: DBType;
	config: ReportConfigPartIndividualSchemaType | null;
	commonFilters: JournalFilterSchemaWithoutPaginationType[];
	filters: ConfigFilters;
	dbDateRange: DBDateRangeType;
	currency: currencyFormatType;
}): ReportElementItemData => {
	if (!config) return;

	const dateRange = filtersToDateRange(commonFilters, dbDateRange);
	const getDataFromKey = getCombinedFilters({
		commonFilters,
		configFilters: filters,
		db,
		dateRange
	});

	if (config.type === 'none') {
		return config;
	}

	const commonParametersReduced = {
		db,
		getDataFromKey
	};

	const commonParameters = {
		db,
		getDataFromKey
	};

	if (config.type === 'number') {
		return getDataDetail.number({
			config,
			...commonParametersReduced
		});
	}

	if (config.type === 'string') {
		return getDataDetail.string({
			config,
			...commonParametersReduced,
			currency
		});
	}

	if (config.type === 'sparkline') {
		return getDataDetail.sparkline({ config, ...commonParameters, currency });
	}
	if (config.type === 'sparklinebar') {
		return getDataDetail.sparkline({ config, ...commonParameters, currency });
	}

	if (
		config.type === 'time_line' ||
		config.type === 'time_stackedArea' ||
		config.type === 'time_bar'
	) {
		return getDataDetail.timeGraph({ config, ...commonParameters });
	}

	if (config.type === 'pie' || config.type === 'box') {
		return getDataDetail.nonTimeGraph({ config, ...commonParameters });
	}

	throw new Error("Couldn't find Report Element Type");
};

export type GetFilterFromKeyType = (key: string) => Promise<{
	filter: SQL<unknown>[];
	action: 'sum' | 'count' | 'min' | 'max' | 'avg';
} | null>;

const getDataDetail = {
	number: ({
		db,
		config,
		getDataFromKey
	}: {
		db: DBType;
		config: ReportConfigPartSchemaNumberCurrencyType;
		getDataFromKey: GetDataForFilterKeyType;
	}) => {
		const data = async () => {
			return mathConfigToNumber({
				db,
				mathConfig: config.mathConfig,
				getDataFromKey
			});
		};

		return { ...config, data: data() };
	},
	string: ({
		db,
		config,
		getDataFromKey,
		currency
	}: {
		db: DBType;
		config: ReportConfigPartSchemaStringType;
		getDataFromKey: GetDataForFilterKeyType;
		currency: currencyFormatType;
	}) => {
		const data = async () => {
			return stringConfigToString({
				db,
				stringConfig: config.stringConfig,
				getDataFromKey,
				numberDisplay: config.numberDisplay,
				currency
			});
		};

		return { ...config, data: data() };
	},
	sparkline: ({
		db,
		config,
		getDataFromKey,
		currency
	}: {
		db: DBType;
		config: ReportConfigPartSchemaSparklineType;
		getDataFromKey: GetDataForFilterKeyType;
		currency: currencyFormatType;
	}) => {
		const data = async () => {
			return sparklineConfigToData({
				db,
				config,
				getDataFromKey,
				currency
			});
		};

		return { ...config, data: data() };
	},
	timeGraph: ({
		db,
		config,
		getDataFromKey
	}: {
		db: DBType;
		config: ReportConfigPartSchemaTimeGraphType;
		getDataFromKey: GetDataForFilterKeyType;
	}) => {
		const data = async () => {
			return timelineConfigToData({
				db,
				config,
				getDataFromKey
			});
		};

		return { ...config, data: data() };
	},
	nonTimeGraph: ({
		db,
		config,
		getDataFromKey
	}: {
		db: DBType;
		config: ReportConfigPartSchemaNonTimeGraphType;
		getDataFromKey: GetDataForFilterKeyType;
	}) => {
		const data = async () => {
			return groupedMathConfigToNumber({
				db,
				config,
				getDataFromKey
			});
		};

		return { ...config, data: data() };
	}
};

export type ReportConfigPartNone = {
	id: string;
	type: 'none';
	order: number;
};

export type ReportConfigPartWithData_NumberCurrency = ReturnType<typeof getDataDetail.number>;

export type ReportConfigPartWithData_String = ReturnType<typeof getDataDetail.string>;

export type ReportConfigPartWithData_Sparkline = ReturnType<typeof getDataDetail.sparkline>;

export type ReportConfigPartWithData_TimeGraph = ReturnType<typeof getDataDetail.timeGraph>;

export type ReportConfigPartWithData_NonTimeGraph = ReturnType<typeof getDataDetail.nonTimeGraph>;

export type ReportElementItemData =
	| ReportConfigPartWithData_NonTimeGraph
	| ReportConfigPartWithData_NumberCurrency
	| ReportConfigPartWithData_Sparkline
	| ReportConfigPartWithData_String
	| ReportConfigPartWithData_TimeGraph
	| ReportConfigPartNone
	| undefined;
