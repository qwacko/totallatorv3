import { SQL, inArray, notInArray, sql } from 'drizzle-orm';

type columnType = Parameters<typeof inArray>[0];

export const inArrayWrapped = (column: columnType, values: string[]): SQL<unknown> => {
	return values.length === 0 ? sql`FALSE` : inArray(column, values);
};

export const notInArrayWrapped = (column: columnType, values: string[]): SQL<unknown> => {
	return values.length === 0 ? sql`TRUE` : notInArray(column, values);
};
