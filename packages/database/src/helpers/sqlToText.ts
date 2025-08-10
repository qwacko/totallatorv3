import { SQL } from 'drizzle-orm';
import { PgDialect } from 'drizzle-orm/pg-core';
import { format } from 'sql-formatter';

const pgDialect = new PgDialect();
export const sqlToText = (sqlQuery: SQL<unknown>) => {
	return format(pgDialect.sqlToQuery(sqlQuery).sql, {
		language: 'postgresql',
		dataTypeCase: 'upper',
		identifierCase: 'upper',
		functionCase: 'upper',
		keywordCase: 'upper'
	});
};
