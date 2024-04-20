import { asc, desc, type SQL } from 'drizzle-orm';
import type { GroupedQueryLogOrderByEnumType } from '$lib/schema/enum/groupedQueryLogOrderByEnum';
import type { GroupedQueryLogSubqueryType } from './groupedQueryLogSubquery';

export const groupedQueryLogOrderByToSQL = ({
	orderBy,
	subquery
}: {
	orderBy?: { field: GroupedQueryLogOrderByEnumType; direction: 'asc' | 'desc' }[];
	subquery: GroupedQueryLogSubqueryType;
}): SQL<unknown>[] => {
	const defaultOrderBy = [asc(subquery.title)];

	const orderByResult = orderBy
		? [
				...orderBy.map((currentOrder) => {
					let field = subquery[currentOrder.field];

					return currentOrder.direction === 'asc' ? asc(field) : desc(field);
				}),
				...defaultOrderBy
			]
		: defaultOrderBy;

	return orderByResult;
};
