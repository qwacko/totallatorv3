export const reportConfigPartNegativeDisplayEnum = [
	'hide',
	'grouped',
	'absolute',
	'default'
] as const;
export type ReportConfigPartNegativeDisplayType =
	(typeof reportConfigPartNegativeDisplayEnum)[number];

export const reportConfigPartNegativeDisplayInfo = {
	hide: {
		id: 'hide',
		name: 'Hide Negative Groups'
	},
	grouped: {
		id: 'grouped',
		name: 'Seperately Group'
	},
	absolute: {
		id: 'absolute',
		name: 'Absolute Values'
	},
	default: {
		id: 'default',
		name: 'No Change'
	}
} satisfies {
	[key in ReportConfigPartNegativeDisplayType]: {
		id: key;
		name: string;
	};
};

export type ReportConfigPartNegativeDisplayInfo = typeof reportConfigPartNegativeDisplayInfo;

export const reportConfigPartNegativeDisplayDropdown = Object.values(
	reportConfigPartNegativeDisplayInfo
).map((option) => {
	return {
		name: option.name,
		value: option.id
	};
});
