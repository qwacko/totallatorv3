export const reportConfigPartTypeEnum = [
	'none',
	'number',
	'currency',
	'string',
	'sparkline',
	'sparklinebar',
	'time_line',
	'time_stackedArea',
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
		showItemGrouping: false
	},
	number: {
		id: 'number',
		name: 'Number',
		showStringConfig: false,
		showMathConfig: true,
		showTimeGrouping: false,
		showItemGrouping: false
	},
	currency: {
		id: 'currency',
		name: 'Currency',
		showStringConfig: false,
		showMathConfig: true,
		showTimeGrouping: false,
		showItemGrouping: false
	},
	string: {
		id: 'string',
		name: 'String',
		showStringConfig: true,
		showMathConfig: false,
		showTimeGrouping: false,
		showItemGrouping: false
	},
	sparkline: {
		id: 'sparkline',
		name: 'Sparkline',
		showStringConfig: false,
		showMathConfig: true,
		showTimeGrouping: true,
		showItemGrouping: false
	},
	sparklinebar: {
		id: 'sparklinebar',
		name: 'Sparkline Bar',
		showStringConfig: false,
		showMathConfig: true,
		showTimeGrouping: true,
		showItemGrouping: false
	},
	time_line: {
		id: 'time_line',
		name: 'Time Line',
		showStringConfig: false,
		showMathConfig: true,
		showTimeGrouping: true,
		showItemGrouping: true
	},
	time_stackedArea: {
		id: 'time_stackedArea',
		name: 'Time Stacked Area',
		showStringConfig: false,
		showMathConfig: true,
		showTimeGrouping: true,
		showItemGrouping: true
	},
	pie: {
		id: 'pie',
		name: 'Pie',
		showStringConfig: false,
		showMathConfig: true,
		showTimeGrouping: false,
		showItemGrouping: true
	},
	box: {
		id: 'box',
		name: 'Box',
		showStringConfig: false,
		showMathConfig: true,
		showTimeGrouping: false,
		showItemGrouping: true
	},
	bar: {
		id: 'bar',
		name: 'Bar',
		showStringConfig: false,
		showMathConfig: true,
		showTimeGrouping: false,
		showItemGrouping: true
	}
} satisfies {
	[key in ReportConfigPartType]: {
		id: key;
		name: string;
		showStringConfig: boolean;
		showMathConfig: boolean;
		showTimeGrouping: boolean;
		showItemGrouping: boolean;
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
