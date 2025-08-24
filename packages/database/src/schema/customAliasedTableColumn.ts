import { type ColumnBaseConfig, type ColumnDataType, sql } from 'drizzle-orm';
import { PgColumn } from 'drizzle-orm/pg-core';

export const customAliasedTableColumn = <
	T extends ColumnBaseConfig<ColumnDataType, string> = ColumnBaseConfig<ColumnDataType, string>
>(
	column: PgColumn<T>,
	alias: string
) => {
	return sql<typeof column>`${column}`.as(alias) as unknown as typeof column;
};
