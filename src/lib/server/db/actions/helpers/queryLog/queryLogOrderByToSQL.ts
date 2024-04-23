import { asc, desc, type SQL } from 'drizzle-orm';
import type { QueryLogOrderByEnumType } from '$lib/schema/enum/queryLogOrderByEnum';
import { queryLogTable } from '$lib/server/db/postgres/schema';

export const queryLogOrderByToSQL = ({
	orderBy
}: {
	orderBy?: { field: QueryLogOrderByEnumType; direction: 'asc' | 'desc' }[];
}): SQL<unknown>[] => {
	const defaultOrderBy = [desc(queryLogTable.time)];

	const orderByResult = orderBy
		? [
				...orderBy.map((currentOrder) => {
					let field = queryLogTable[currentOrder.field];

					return currentOrder.direction === 'asc' ? asc(field) : desc(field);
				}),
				...defaultOrderBy
			]
		: defaultOrderBy;

	return orderByResult;
};
