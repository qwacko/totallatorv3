import { eq, gte, inArray, like, lte, or, SQLWrapper } from 'drizzle-orm';

import type { LogFilterValidationOutputType } from '@totallator/shared';

import { logTable } from '../schema/index.js';

export const filterLogsToSQL = (filter: LogFilterValidationOutputType): SQLWrapper[] => {
	const conditions: SQLWrapper[] = [];

	if (filter.action && filter.action.length > 0) {
		conditions.push(inArray(logTable.action, filter.action));
	}
	if (filter.domain && filter.domain.length > 0) {
		conditions.push(inArray(logTable.domain, filter.domain));
	}
	if (filter.level && filter.level.length > 0) {
		conditions.push(inArray(logTable.logLevel, filter.level));
	}
	if (filter.text && filter.text.length > 0) {
		const targetText = `%${filter.text}%`;
		const condition = or(like(logTable.title, targetText), like(logTable.dataString, targetText));
		if (condition) {
			conditions.push(condition);
		}
	}
	if (filter.startDate) {
		conditions.push(gte(logTable.date, filter.startDate));
	}
	if (filter.endDate) {
		conditions.push(lte(logTable.date, filter.endDate));
	}
	if (filter.contextId && filter.contextId.length > 0) {
		conditions.push(inArray(logTable.contextId, filter.contextId));
	}
	if (filter.code && filter.code.length > 0) {
		conditions.push(inArray(logTable.code, filter.code));
	}

	if (conditions.length === 0) {
		conditions.push(eq(logTable.action, logTable.action));
	}

	return conditions;
};
