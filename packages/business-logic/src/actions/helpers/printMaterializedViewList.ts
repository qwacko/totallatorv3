import { sql } from 'drizzle-orm';
import {
	PgView,
	getMaterializedViewConfig,
	getViewConfig,
	type PgMaterializedViewWithSelection
} from 'drizzle-orm/pg-core';
import { getLogger } from '@/logger';
import fs from 'fs';
import { buildMaterializedIndexes, dropMaterializedIndexes } from '@totallator/database';
import { sqlToText } from './sqlToText';

const filename = 'materializedViewCombined.sql';

export const printMaterializedViewList = (
	materializedList: PgMaterializedViewWithSelection<any, any, any>[],
	viewList: PgView<any, any>[]
) => {
	let outputText = '';

	const newlineText = '; --> statement-breakpoint \n';

	const queryText = dropMaterializedIndexes();

	for (let i = 0; i < queryText.length; i++) {
		outputText += queryText[i] + newlineText;
	}

	for (let i = materializedList.length - 1; i >= 0; i--) {
		outputText +=
			sqlToText(sql`drop materialized view if exists ${materializedList[i]}`) + newlineText;
	}

	outputText += '\n';

	for (let i = viewList.length - 1; i >= 0; i--) {
		outputText += sqlToText(sql`drop view if exists ${viewList[i]}`) + newlineText;
	}

	outputText += '\n';

	for (let i = viewList.length - 1; i >= 0; i--) {
		const view = viewList[i];
		outputText +=
			sqlToText(sql`create view ${view} as ${getViewConfig(view).query}`) + newlineText + '\n';
	}

	for (let i = materializedList.length - 1; i >= 0; i--) {
		const materializedView = materializedList[i];
		outputText +=
			sqlToText(
				sql`create materialized view ${materializedView} as ${
					getMaterializedViewConfig(materializedView).query
				}`
			) +
			newlineText +
			'\n';
	}

	const createIndexQueryText = buildMaterializedIndexes();

	for (let i = 0; i < createIndexQueryText.length; i++) {
		outputText += createIndexQueryText[i] + newlineText;
	}

	//Write To File
	fs.writeFile(filename, outputText, (err) => {
		if (err) {
			getLogger('materialized-views').error({ code: 'MAT_VIEW_001', title: 'Failed to write materialized view file', error: err });
		}
	});
};
