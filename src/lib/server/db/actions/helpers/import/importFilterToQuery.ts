import {
	importStatusToTest,
	type ImportFilterSchemaType,
	importTypeToTitle
} from '$lib/schema/importSchema';
import { SQL, eq, ilike, inArray, or, sql } from 'drizzle-orm';
import type { ImportSubqueryType } from './importListSubquery';
import { idTitleFilterToText } from '../misc/filterToQueryTitleIDCore';
import { importTable } from '$lib/server/db/postgres/schema';
import type { DBType } from '$lib/server/db/db';

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
	if (filter.idArray && filter.idArray.length > 0) {
		where.push(inArray(query.id, filter.idArray));
	}
	if (filter.filename) {
		where.push(eq(query.filename, filter.filename));
	}
	if (filter.source && filter.source.length > 0) {
		where.push(inArray(query.source, filter.source));
	}
	if (filter.status && filter.status.length > 0) {
		where.push(inArray(query.status, filter.status));
	}
	if (filter.type && filter.type.length > 0) {
		where.push(inArray(query.type, filter.type));
	}
	if (filter.mapping) {
		const useFilterText = `%${filter.textFilter}%`;
		where.push(sql`${query.importMappingTitle} ILIKE ${useFilterText}`);
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

	return where;
};

const importIdToTitle = async (db: DBType, id: string) => {
	const foundImport = await db
		.select({ title: importTable.title })
		.from(importTable)
		.where(eq(importTable.id, id))
		.limit(1)
		.execute();

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
	if (filter.type && filter.type.length > 0) {
		stringArray.push(`Source is ${filter.type.map((item) => importTypeToTitle(item)).join(', ')}`);
	}
	if (filter.mapping) {
		stringArray.push(`Mapping contains ${filter.mapping}`);
	}
	if (filter.textFilter) {
		stringArray.push(`Title or Import Mapping contains ${filter.textFilter}`);
	}

	if (stringArray.length === 0) {
		return ['Showing All Imports'];
	}

	return stringArray;
};
