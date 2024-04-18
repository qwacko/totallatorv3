import { SQL, sql } from 'drizzle-orm';
import {
	getMaterializedViewConfig,
	type PgMaterializedViewWithSelection
} from 'drizzle-orm/pg-core';
import { logging } from '$lib/server/logging';
import { PgDialect } from 'drizzle-orm/pg-core';
import { format } from 'sql-formatter';
import fs from 'fs';

const pgDialect = new PgDialect();

const filename = 'materializedViewCombined.sql';

export const sqlToText = (sqlQuery: SQL<unknown>) => {
	return format(pgDialect.sqlToQuery(sqlQuery).sql, {
		language: 'postgresql',
		dataTypeCase: 'upper',
		identifierCase: 'upper',
		functionCase: 'upper',
		keywordCase: 'upper'
	});
};

export const printMaterializedViewList = (
	materializedList: PgMaterializedViewWithSelection<any, any, any>[]
) => {
	let outputText = '';

	for (let i = materializedList.length - 1; i >= 0; i--) {
		const materializedView = materializedList[i];

		outputText +=
			sqlToText(sql`drop materialized view if exists ${materializedView}`) +
			'; --> statement-breakpoint \n' +
			sqlToText(
				sql`create materialized view ${materializedView} as ${
					getMaterializedViewConfig(materializedView).query
				}`
			) +
			'; --> statement-breakpoint \n\n';
	}

	//Write To File
	fs.writeFile(filename, outputText, (err) => {
		if (err) {
			logging.error(err);
		}
	});
};
