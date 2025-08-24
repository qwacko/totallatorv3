import { eq, inArray, SQLWrapper } from 'drizzle-orm';

import type { LogFilterConfigValidationOutputType } from '@totallator/shared';

import { configurationTable } from './../schema/index.js';

export const filterConfigurationsToSQL = (
	filter: LogFilterConfigValidationOutputType
): SQLWrapper[] => {
	const conditions: SQLWrapper[] = [];

	if (filter.action && filter.action.length > 0) {
		conditions.push(inArray(configurationTable.action, filter.action));
	}
	if (filter.destination && filter.destination.length > 0) {
		conditions.push(inArray(configurationTable.destination, filter.destination));
	}
	if (filter.domain && filter.domain.length > 0) {
		conditions.push(inArray(configurationTable.domain, filter.domain));
	}

	if (conditions.length === 0) {
		conditions.push(eq(configurationTable.action, configurationTable.action));
	}

	return conditions;
};
