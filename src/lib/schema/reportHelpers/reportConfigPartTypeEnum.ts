export const reportConfigPartTypeEnum = [
	'none',
	'number',
	'string',
	'sparkline',
	'sparklinebar',
	'time_line',
	'time_stackedArea',
	'time_bar',
	'pie',
	'box',
	'bar'
] as const;
export type ReportConfigPartType = (typeof reportConfigPartTypeEnum)[number];

export const reportConfigPartTypeInfo = {
	none: {
		id: 'none',
		name: 'None',
		showStringConfig: false,
		showMathConfig: false,
		showTimeGrouping: false,
		showItemGrouping: false,
		showNumberDisplay: false,
		showTrendDisplay: false,
		showIncludeTotal: false
	},
	number: {
		id: 'number',
		name: 'Number',
		showStringConfig: false,
		showMathConfig: true,
		showTimeGrouping: false,
		showItemGrouping: false,
		showNumberDisplay: true,
		showTrendDisplay: false,
		showIncludeTotal: false
	},
	string: {
		id: 'string',
		name: 'String',
		showStringConfig: true,
		showMathConfig: false,
		showTimeGrouping: false,
		showItemGrouping: false,
		showNumberDisplay: true,
		showTrendDisplay: false,
		showIncludeTotal: false
	},
	sparkline: {
		id: 'sparkline',
		name: 'Sparkline',
		showStringConfig: false,
		showMathConfig: true,
		showTimeGrouping: true,
		showItemGrouping: false,
		showNumberDisplay: true,
		showTrendDisplay: false,
		showIncludeTotal: false
	},
	sparklinebar: {
		id: 'sparklinebar',
		name: 'Sparkline Bar',
		showStringConfig: false,
		showMathConfig: true,
		showTimeGrouping: true,
		showItemGrouping: false,
		showNumberDisplay: true,
		showTrendDisplay: false,
		showIncludeTotal: false
	},
	time_line: {
		id: 'time_line',
		name: 'Time Line',
		showStringConfig: false,
		showMathConfig: true,
		showTimeGrouping: true,
		showItemGrouping: true,
		showNumberDisplay: true,
		showTrendDisplay: true,
		showIncludeTotal: true
	},
	time_bar: {
		id: 'time_bar',
		name: 'Time Line (Bar)',
		showStringConfig: false,
		showMathConfig: true,
		showTimeGrouping: true,
		showItemGrouping: true,
		showNumberDisplay: true,
		showTrendDisplay: true,
		showIncludeTotal: true
	},
	time_stackedArea: {
		id: 'time_stackedArea',
		name: 'Time Stacked Area',
		showStringConfig: false,
		showMathConfig: true,
		showTimeGrouping: true,
		showItemGrouping: true,
		showNumberDisplay: true,
		showTrendDisplay: true,
		showIncludeTotal: true
	},
	pie: {
		id: 'pie',
		name: 'Pie',
		showStringConfig: false,
		showMathConfig: true,
		showTimeGrouping: false,
		showItemGrouping: true,
		showNumberDisplay: true,
		showTrendDisplay: true,
		showIncludeTotal: false
	},
	box: {
		id: 'box',
		name: 'Box',
		showStringConfig: false,
		showMathConfig: true,
		showTimeGrouping: false,
		showItemGrouping: true,
		showNumberDisplay: true,
		showTrendDisplay: true,
		showIncludeTotal: false
	},
	bar: {
		id: 'bar',
		name: 'Bar',
		showStringConfig: false,
		showMathConfig: true,
		showTimeGrouping: false,
		showItemGrouping: true,
		showNumberDisplay: true,
		showTrendDisplay: true,
		showIncludeTotal: false
	}
} satisfies {
	[key in ReportConfigPartType]: {
		id: key;
		name: string;
		showStringConfig: boolean;
		showMathConfig: boolean;
		showTimeGrouping: boolean;
		showItemGrouping: boolean;
		showNumberDisplay: boolean;
		showTrendDisplay: boolean;
		showIncludeTotal: boolean;
	};
};

export type ReportConfigPartInfoType = typeof reportConfigPartTypeInfo;

export const reportConfigPartTypeDropdown = Object.values(reportConfigPartTypeInfo).map(
	(option) => {
		return {
			name: option.name,
			value: option.id
		};
	}
);
