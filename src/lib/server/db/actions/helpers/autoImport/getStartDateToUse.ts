export const getStartDateToUse = ({
	startDate,
	lookbackDays
}: {
	startDate?: string;
	lookbackDays?: number;
}): Date => {
	const configStartDate = startDate ? new Date(startDate) : undefined;
	const offsetStartDate = new Date();
	const lookbackDaysUse = lookbackDays || 30;
	offsetStartDate.setDate(offsetStartDate.getDate() - lookbackDaysUse);

	const useStartDate = !configStartDate
		? offsetStartDate
		: configStartDate > offsetStartDate
			? configStartDate
			: offsetStartDate;

	return useStartDate;
};
