import type { ImportOrderByEnum } from '$lib/schema/importSchema';
import { asc, desc, type SQL } from 'drizzle-orm';
import type { ImportSubqueryType } from './importListSubquery';

export const importToOrderByToSQL = ({
	orderBy,
	query
}: {
	orderBy?: { field: ImportOrderByEnum; direction: 'asc' | 'desc' }[];
	query: ImportSubqueryType;
}): SQL<unknown>[] => {
	const defaultOrderBy = [desc(query.createdAt)];

	const orderByResult = orderBy
		? [
				...orderBy.map((currentOrder) => {
					let field: (typeof query)[keyof typeof query] = query[currentOrder.field];

					return currentOrder.direction === 'asc' ? asc(field) : desc(field);
				}),
				...defaultOrderBy
			]
		: defaultOrderBy;

	return orderByResult;
};
