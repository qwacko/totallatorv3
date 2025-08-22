import { asc, desc, SQL } from 'drizzle-orm';

import { journalExtendedView, journalView } from '@totallator/database';
import type { JournalFilterSchemaType } from '@totallator/shared';

export const materializedJournalFilterToOrderBy = (
	filter: JournalFilterSchemaType,
	target: 'materialized' | 'view' = 'materialized'
): SQL<unknown>[] => {
	const { orderBy } = filter;

	const targetTable = target === 'view' ? journalView : journalExtendedView;
	const defaultOrderBy = [
		desc(targetTable.amount),
		desc(targetTable.createdAt),
		desc(targetTable.id)
	];

	if (!orderBy) {
		return [desc(targetTable.date), ...defaultOrderBy];
	}
	const processedOrderBy = orderBy.map((currentOrder) => {
		if (
			currentOrder.field === 'amount' ||
			currentOrder.field === 'complete' ||
			currentOrder.field === 'dataChecked' ||
			currentOrder.field === 'date' ||
			currentOrder.field === 'description' ||
			currentOrder.field === 'linked' ||
			currentOrder.field === 'reconciled'
		) {
			if (currentOrder.direction === 'asc') {
				return asc(targetTable[currentOrder.field]);
			}
			return desc(targetTable[currentOrder.field]);
		}
		if (currentOrder.field === 'accountName') {
			if (currentOrder.direction === 'asc') {
				return asc(targetTable.accountTitle);
			}
			return desc(targetTable.accountTitle);
		}

		return desc(targetTable.date);
	});

	return [...processedOrderBy, ...defaultOrderBy];
};
