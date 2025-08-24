import { eq, ilike, or, SQL, sql } from 'drizzle-orm';

import { importTable } from '@totallator/database';
import type { DBType } from '@totallator/database';
import {
	type ImportFilterSchemaType,
	importStatusToTest,
	importTypeToTitle
} from '@totallator/shared';

import { dbExecuteLogger } from '@/server/db/dbLogger';

import { autoImportIdToTitle } from '../autoImport/autoImportFilterToQuery';
import { idTitleFilterToText } from '../misc/filterToQueryTitleIDCore';
import { inArrayWrapped } from '../misc/inArrayWrapped';
import type { ImportSubqueryType } from './importListSubquery';

export const importFilterToQuery = ({
	filter,
	query
}: {
	filter: Omit<ImportFilterSchemaType, 'page' | 'pageSize' | 'orderBy'>;
	query: ImportSubqueryType;
}) => {
	const where: SQL<unknown>[] = [];

	if (filter.id) {
		where.push(eq(query.id, filter.id));
	}
	if (filter.title) {
		where.push(ilike(query.title, `%${filter.title}%`));
	}
	if (filter.autoProcess !== undefined) {
		where.push(eq(query.autoProcess, filter.autoProcess));
	}
	if (filter.autoClean !== undefined) {
		where.push(eq(query.autoClean, filter.autoClean));
	}
	if (filter.idArray && filter.idArray.length > 0) {
		where.push(inArrayWrapped(query.id, filter.idArray));
	}
	if (filter.filename) {
		where.push(eq(query.filename, filter.filename));
	}
	if (filter.source && filter.source.length > 0) {
		where.push(inArrayWrapped(query.source, filter.source));
	}
	if (filter.status && filter.status.length > 0) {
		where.push(inArrayWrapped(query.status, filter.status));
	}
	if (filter.type && filter.type.length > 0) {
		where.push(inArrayWrapped(query.type, filter.type));
	}
	if (filter.mapping) {
		where.push(eq(query.importMappingId, filter.mapping));
	}
	if (filter.textFilter) {
		const useFilterText = `%${filter.textFilter}%`;

		const orFilter = or(
			sql`${query.importMappingTitle} ILIKE ${useFilterText}`,
			ilike(query.title, `%${filter.textFilter}%`)
		);

		if (orFilter) {
			where.push(orFilter);
		}
	}

	if (filter.autoImportId) {
		where.push(eq(query.autoImportId, filter.autoImportId));
	}

	return where;
};

const importIdToTitle = async (db: DBType, id: string) => {
	const foundImport = await dbExecuteLogger(
		db
			.select({ title: importTable.title })
			.from(importTable)
			.where(eq(importTable.id, id))
			.limit(1),
		'importIdToTitle'
	);

	if (foundImport?.length === 1) {
		return foundImport[0].title;
	}
	return id;
};

export const importFilterToText = async ({
	db,
	filter
}: {
	db: DBType;
	filter: ImportFilterSchemaType;
}) => {
	const stringArray: string[] = [];
	await idTitleFilterToText(db, stringArray, filter, importIdToTitle);
	if (filter.filename) {
		stringArray.push(`Filename contains ${filter.filename}`);
	}
	if (filter.source && filter.source.length > 0) {
		stringArray.push(`Source is ${filter.source.join(', ')}`);
	}
	if (filter.status && filter.status.length > 0) {
		stringArray.push(
			`Status is ${filter.status.map((item) => importStatusToTest(item)).join(', ')}`
		);
	}
	if (filter.autoProcess !== undefined) {
		stringArray.push(`Processing is ${filter.autoProcess ? 'Automatic' : 'Manual'}`);
	}
	if (filter.autoClean !== undefined) {
		stringArray.push(`Cleaning is ${filter.autoClean ? 'Automatic' : 'Manual'}`);
	}
	if (filter.type && filter.type.length > 0) {
		stringArray.push(`Source is ${filter.type.map((item) => importTypeToTitle(item)).join(', ')}`);
	}
	if (filter.mapping) {
		stringArray.push(`Mapping contains ${filter.mapping}`);
	}
	if (filter.textFilter) {
		stringArray.push(`Title or Import Mapping contains ${filter.textFilter}`);
	}
	if (filter.autoImportId) {
		stringArray.push(`Auto Import is ${await autoImportIdToTitle(db, filter.autoImportId)}`);
	}

	if (stringArray.length === 0) {
		return ['Showing All Imports'];
	}

	return stringArray;
};
