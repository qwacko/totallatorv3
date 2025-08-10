import type { ReportLayoutIds } from './schemas/reportSchema';

type ReportLayoutDropdownObject = {
	[K in ReportLayoutIds]: string;
};
type ReportLayoutDropdownOptionsType = Array<{ id: ReportLayoutIds; title: string }>;

const reportLayoutDropdownObject = {
	default: 'Default',
	sixEven: 'Six Even',
	wideOnly: 'Wide Only'
} satisfies ReportLayoutDropdownObject;

export const reportLayoutDropdownOptions = (
	Object.keys(reportLayoutDropdownObject) as Array<keyof typeof reportLayoutDropdownObject>
)
	.map((key) => ({
		id: key,
		title: reportLayoutDropdownObject[key]
	}))
	.sort((a, b) => a.title.localeCompare(b.title)) satisfies ReportLayoutDropdownOptionsType;

type ReportLayoutOptionsType = {
	[K in ReportLayoutIds]: Array<{ order: number; cols: number; rows: number; title?: string }>;
};
export const reportLayoutOptions: ReportLayoutOptionsType = {
	default: [
		{ order: 1, cols: 5, rows: 3, title: 'Running Total By Tag' },
		{ order: 2, cols: 1, rows: 1, title: 'Total' },
		{ order: 3, cols: 1, rows: 1, title: 'Cash' },
		{ order: 4, cols: 1, rows: 1, title: 'Net Worth' },
		{ order: 5, cols: 6, rows: 4, title: 'Journals' }
	],
	sixEven: [
		{ order: 1, cols: 3, rows: 3 },
		{ order: 2, cols: 3, rows: 3 },
		{ order: 3, cols: 3, rows: 3 },
		{ order: 4, cols: 3, rows: 3 },
		{ order: 5, cols: 3, rows: 3 },
		{ order: 6, cols: 3, rows: 3 }
	],
	wideOnly: [
		{ order: 1, cols: 6, rows: 3 },
		{ order: 2, cols: 6, rows: 3 },
		{ order: 3, cols: 6, rows: 3 }
	]
};

export const getNextReportLayoutOption = (current: ReportLayoutIds) => {
	const keys = Object.keys(reportLayoutOptions) as Array<keyof typeof reportLayoutOptions>;
	const index = keys.indexOf(current);
	const nextIndex = index + 1 >= keys.length ? 0 : index + 1;
	return keys[nextIndex];
};

export const getPreviousReportLayoutOption = (current: ReportLayoutIds) => {
	const keys = Object.keys(reportLayoutOptions) as Array<keyof typeof reportLayoutOptions>;
	const index = keys.indexOf(current);
	const nextIndex = index - 1 < 0 ? keys.length - 1 : index - 1;
	return keys[nextIndex];
};
