export const getFiltersFromMathConfig = (mathConfig: string) => {
	const filters = mathConfig.match(/{([^}]+)}/g);

	if (!filters) {
		return [];
	}

	return filters.map((filter) => ({
		targetText: filter,
		targetFilter: filter.replace(/{|}/g, '').trim()
	}));
};
