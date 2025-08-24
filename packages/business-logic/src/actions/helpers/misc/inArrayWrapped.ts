import { ilike, inArray, notInArray, or, SQL, sql } from 'drizzle-orm';

type columnType = Parameters<typeof inArray>[0];

type ilikeColumnType = Parameters<typeof ilike>[0];

export const inArrayWrapped = (column: columnType, values: string[]): SQL<unknown> => {
	return values.length === 0 ? sql`FALSE` : inArray(column, values);
};

export const notInArrayWrapped = (column: columnType, values: string[]): SQL<unknown> => {
	return values.length === 0 ? sql`TRUE` : notInArray(column, values);
};

export const ilikeArrayWrapped = (column: ilikeColumnType, values: string[]): SQL<unknown> => {
	if (values.length === 1) {
		return ilike(column, `%${values[0]}%`);
	}
	const returnOr = or(...values.map((value) => ilike(column, `%${value}%`)));
	if (returnOr) {
		return returnOr;
	}
	return sql`FALSE`;
};
