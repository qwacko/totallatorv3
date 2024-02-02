export const reportConfigPartNumberDisplayEnum = [
	'number','currency','percent'
] as const;
export type ReportConfigPartNumberDisplayType = (typeof reportConfigPartNumberDisplayEnum)[number];

export const reportConfigPartNumberDisplayInfo = {
	number: {
		id: 'number',
		name: 'Number',
	},
	currency: {
		id: 'currency',
		name: 'Currency',
	},
	percent: {
		id: 'percent',
		name: 'Percent',
	},
	
} satisfies {
	[key in ReportConfigPartNumberDisplayType]: {
		id: key;
		name: string;
	};
};

export type ReportConfigPartNumberDisplayInfo = typeof reportConfigPartNumberDisplayInfo;

export const reportConfigPartNumberDisplayDropdown = Object.values(reportConfigPartNumberDisplayInfo).map(
	(option) => {
		return {
			name: option.name,
			value: option.id
		};
	}
);
