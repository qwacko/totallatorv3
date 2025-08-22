import { eq, ilike, or, SQL } from 'drizzle-orm';

import type { DBType } from '@totallator/database';
import { importMapping } from '@totallator/database';
import type { ImportMappingFilterSchema } from '@totallator/shared';

import { dbExecuteLogger } from '@/server/db/dbLogger';

import { arrayToText } from '../misc/arrayToText';
import { inArrayWrapped } from '../misc/inArrayWrapped';

export const importMappingFilterToQuery = (
	filter: Omit<ImportMappingFilterSchema, 'page' | 'pageSize' | 'orderBy'>
) => {
	const restFilter = filter;

	const where: SQL<unknown>[] = [];
	if (restFilter.id) where.push(eq(importMapping.id, restFilter.id));
	if (restFilter.idArray && restFilter.idArray.length > 0)
		where.push(inArrayWrapped(importMapping.id, restFilter.idArray));
	if (restFilter.title) where.push(ilike(importMapping.title, `%${restFilter.title}%`));
	if (restFilter.configuration)
		where.push(ilike(importMapping.title, `%${restFilter.configuration}%`));
	if (restFilter.combinedText) {
		const orValue = or(
			ilike(importMapping.title, `%${restFilter.combinedText}%`),
			ilike(importMapping.configuration, `%${restFilter.combinedText}%`)
		);
		if (orValue) where.push(orValue);
	}

	return where;
};

export const importMappingIdToTitle = async (db: DBType, id: string) => {
	const foundImportMapping = await dbExecuteLogger(
		db
			.select({ title: importMapping.title })
			.from(importMapping)
			.where(eq(importMapping.id, id))
			.limit(1),
		'importMappingIdToTitle'
	);

	if (foundImportMapping?.length === 1) {
		return foundImportMapping[0].title;
	}
	return id;
};

const importMappingIdsToTitle = async (db: DBType, ids: string[]) => {
	const titles = await Promise.all(ids.map(async (id) => importMappingIdToTitle(db, id)));

	return titles;
};

export const importMappingFilterToText = async (
	db: DBType,
	filter: Omit<ImportMappingFilterSchema, 'page' | 'pageSize' | 'orderBy'>,

	{ prefix, allText = true }: { prefix?: string; allText?: boolean } = {}
) => {
	const restFilter = filter;

	const stringArray: string[] = [];
	if (restFilter.id) stringArray.push(`Is ${await importMappingIdToTitle(db, restFilter.id)}`);
	if (restFilter.idArray && restFilter.idArray.length > 0)
		stringArray.push(
			await arrayToText({
				data: restFilter.idArray,
				singularName: 'Import Mapping',
				inputToText: (title) => importMappingIdsToTitle(db, title)
			})
		);

	if (restFilter.title) stringArray.push(`Title contains ${restFilter.title}`);
	if (restFilter.configuration)
		stringArray.push(`Configuration contains ${restFilter.configuration}`);
	if (restFilter.combinedText)
		stringArray.push(`Title or Configuration contains ${restFilter.combinedText}`);

	if (stringArray.length === 0 && allText) {
		stringArray.push('Showing All');
	}

	if (prefix) {
		return stringArray.map((item) => `${prefix} ${item}`);
	}

	return stringArray;
};
