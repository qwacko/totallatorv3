export const reportConfigPartNumberDisplayEnum = [
	'number',
	'currency',
	'percent',
	'number2dp',
	'percent2dp'
] as const;
export type ReportConfigPartNumberDisplayType = (typeof reportConfigPartNumberDisplayEnum)[number];

export const reportConfigPartNumberDisplayInfo = {
	number: {
		id: 'number',
		name: 'Number'
	},
	currency: {
		id: 'currency',
		name: 'Currency'
	},
	percent: {
		id: 'percent',
		name: 'Percent'
	},
	number2dp: {
		id: 'number2dp',
		name: 'Number (2dp)'
	},
	percent2dp: {
		id: 'percent2dp',
		name: 'Percent (2dp)'
	}
} satisfies {
	[key in ReportConfigPartNumberDisplayType]: {
		id: key;
		name: string;
	};
};

export type ReportConfigPartNumberDisplayInfo = typeof reportConfigPartNumberDisplayInfo;

export const reportConfigPartNumberDisplayDropdown = Object.values(
	reportConfigPartNumberDisplayInfo
).map((option) => {
	return {
		name: option.name,
		value: option.id
	};
});
