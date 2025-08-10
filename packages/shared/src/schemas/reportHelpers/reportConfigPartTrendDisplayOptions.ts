export const reportConfigPartTrendDisplayEnum = [
	'all',
	'top10',
	'nonBlank',
	'top10nonBlank'
] as const;
export type ReportConfigPartTrendDisplayType = (typeof reportConfigPartTrendDisplayEnum)[number];

export const reportConfigPartTrendDisplayInfo = {
	all: {
		id: 'all',
		name: 'All',
		retainBlank: true,
		retainTop: undefined
	},
	top10: {
		id: 'top10',
		name: 'Top 10',
		retainBlank: true,
		retainTop: 10
	},
	nonBlank: {
		id: 'nonBlank',
		name: 'Non-Blank',
		retainBlank: false,
		retainTop: undefined
	},
	top10nonBlank: {
		id: 'top10nonBlank',
		name: 'Top 10 Non-Blank',
		retainBlank: false,
		retainTop: 10
	}
} satisfies {
	[key in ReportConfigPartTrendDisplayType]: {
		id: key;
		name: string;
		retainBlank: boolean;
		retainTop: number | undefined;
	};
};

export type ReportConfigPartTrendDisplayInfoType = typeof reportConfigPartTrendDisplayInfo;

export const reportConfigPartTrendDisplayDropdown = Object.values(
	reportConfigPartTrendDisplayInfo
).map((option) => {
	return {
		name: option.name,
		value: option.id
	};
});
