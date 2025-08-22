import type { JournalSummaryType } from '@totallator/business-logic';

const defaultMonthlySummary: JournalSummaryType['monthlySummary'][number] = {
	average: 0,
	sum: 0,
	negativeSumNonTransfer: 0,
	positiveSumNonTransfer: 0,
	count: 0,
	negativeCount: 0,
	negativeSum: 0,
	positiveCount: 0,
	positiveSum: 0,
	runningCount: 0,
	runningTotal: 0,
	yearMonth: ''
};

export const filterTrendData = ({
	data,
	dates
}: {
	data: JournalSummaryType['monthlySummary'];
	dates: string[];
}) => {
	const filteredItems = dates.map((item) => {
		const matchingData = data.find((current) => current.yearMonth === item);

		if (matchingData) {
			return matchingData;
		}
		return {
			...defaultMonthlySummary,
			yearMonth: item
		};
	});

	return filteredItems;
};
