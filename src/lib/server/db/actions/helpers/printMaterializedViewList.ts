import { sql } from 'drizzle-orm';
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

export const printMaterializedViewList = (
	materializedList: PgMaterializedViewWithSelection<any, any, any>[]
) => {
	let outputText = '';

	for (let i = materializedList.length - 1; i >= 0; i--) {
		const materializedView = materializedList[i];

		outputText +=
			format(
				pgDialect.sqlToQuery(
					sql`create materialized view ${materializedView} as ${
						getMaterializedViewConfig(materializedView).query
					}`
				).sql,
				{
					language: 'postgresql',
					dataTypeCase: 'upper',
					identifierCase: 'upper',
					functionCase: 'upper',
					keywordCase: 'upper'
				}
			) +
			';\n----------------------------------------------------------------------------------------------------\n\n';
	}

	//Write To File
	fs.writeFile(filename, outputText, (err) => {
		if (err) {
			logging.error(err);
		}
	});
};
