import type { ImportMappingFilterSchema } from '$lib/schema/importMappingSchema';
import { db } from '../../../db';
import { importMapping } from '../../../schema';
import { SQL, eq, ilike, inArray, like, or } from 'drizzle-orm';
import { arrayToText } from '../misc/arrayToText';

export const importMappingFilterToQuery = (
	filter: Omit<ImportMappingFilterSchema, 'page' | 'pageSize' | 'orderBy'>
) => {
	const restFilter = filter;

	const where: SQL<unknown>[] = [];
	if (restFilter.id) where.push(eq(importMapping.id, restFilter.id));
	if (restFilter.idArray && restFilter.idArray.length > 0)
		where.push(inArray(importMapping.id, restFilter.idArray));
	if (restFilter.title) where.push(like(importMapping.title, `%${restFilter.title}%`));
	if (restFilter.configuration)
		where.push(ilike(importMapping.title, `%${restFilter.configuration}%`));
	if (restFilter.combinedText) {
		const orValue = or(
			like(importMapping.title, `%${restFilter.combinedText}%`),
			like(importMapping.configuration, `%${restFilter.combinedText}%`)
		);
		if (orValue) where.push(orValue);
	}

	return where;
};

export const importMappingIdToTitle = async (id: string) => {
	const foundImportMapping = await db
		.select({ title: importMapping.title })
		.from(importMapping)
		.where(eq(importMapping.id, id))
		.limit(1)
		.execute();

	if (foundImportMapping?.length === 1) {
		return foundImportMapping[0].title;
	}
	return id;
};

const importMappingIdsToTitle = async (ids: string[]) => {
	const titles = await Promise.all(ids.map(async (id) => importMappingIdToTitle(id)));

	return titles;
};

export const importMappingFilterToText = async (
	filter: Omit<ImportMappingFilterSchema, 'page' | 'pageSize' | 'orderBy'>,

	{ prefix, allText = true }: { prefix?: string; allText?: boolean } = {}
) => {
	const restFilter = filter;

	const stringArray: string[] = [];
	if (restFilter.id) stringArray.push(`Is ${await importMappingIdToTitle(restFilter.id)}`);
	if (restFilter.idArray && restFilter.idArray.length > 0)
		stringArray.push(
			await arrayToText({
				data: restFilter.idArray,
				singularName: 'Import Mapping',
				inputToText: importMappingIdsToTitle
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
