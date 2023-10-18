import type { TagFilterSchemaType } from '$lib/schema/tagSchema';
import { db } from '../../db';
import { tag } from '../../schema';
import { SQL, eq, ilike, inArray, like, not } from 'drizzle-orm';
import { arrayToText } from './arrayToText';
import { importIdsToTitles } from './importIdsToTitles';

export const tagFilterToQuery = (
	filter: Omit<TagFilterSchemaType, 'page' | 'pageSize' | 'orderBy'>
) => {
	const restFilter = filter;

	const where: SQL<unknown>[] = [];
	if (restFilter.id) where.push(eq(tag.id, restFilter.id));
	if (restFilter.idArray) where.push(inArray(tag.id, restFilter.idArray));
	if (restFilter.title) where.push(like(tag.title, `%${restFilter.title}%`));
	if (restFilter.group) where.push(ilike(tag.title, `%${restFilter.group}%`));
	if (restFilter.single) where.push(ilike(tag.title, `%${restFilter.single}%`));
	if (restFilter.status) where.push(eq(tag.status, restFilter.status));
	else where.push(not(eq(tag.status, 'deleted')));
	if (restFilter.deleted) where.push(eq(tag.deleted, restFilter.deleted));
	if (restFilter.disabled) where.push(eq(tag.disabled, restFilter.disabled));
	if (restFilter.allowUpdate) where.push(eq(tag.allowUpdate, restFilter.allowUpdate));
	if (restFilter.active) where.push(eq(tag.active, restFilter.active));
	if (restFilter.importIdArray && restFilter.importIdArray.length > 0)
		where.push(inArray(tag.importId, restFilter.importIdArray));
	if (restFilter.importDetailIdArray && restFilter.importDetailIdArray.length > 0)
		where.push(inArray(tag.importDetailId, restFilter.importDetailIdArray));

	return where;
};

const tagIdToTitle = async (id: string) => {
	const foundTag = await db
		.select({ title: tag.title })
		.from(tag)
		.where(eq(tag.id, id))
		.limit(1)
		.execute();

	if (foundTag?.length === 1) {
		return foundTag[0].title;
	}
	return id;
};

const tagIdsToTitle = async (ids: string[]) => {
	const titles = await Promise.all(ids.map(async (id) => tagIdToTitle(id)));

	return titles;
};

export const tagFilterToText = async (
	filter: Omit<TagFilterSchemaType, 'page' | 'pageSize' | 'orderBy'>,

	{ prefix, allText = true }: { prefix?: string; allText?: boolean } = {}
) => {
	const restFilter = filter;

	const stringArray: string[] = [];
	if (restFilter.id) stringArray.push(`Is ${await tagIdToTitle(restFilter.id)}`);
	if (restFilter.idArray) {
		if (restFilter.idArray.length === 1) {
			stringArray.push(`Is ${await tagIdToTitle(restFilter.idArray[0])}`);
		} else {
			stringArray.push(`Is One Of ${(await tagIdsToTitle(restFilter.idArray)).join(',')}`);
		}
	}
	if (restFilter.title) stringArray.push(`Title contains ${restFilter.title}`);
	if (restFilter.status) stringArray.push(`Status equals ${restFilter.status}`);
	if (restFilter.group) stringArray.push(`Group contains ${restFilter.group}`);
	if (restFilter.single) stringArray.push(`Single contains ${restFilter.single}`);
	//Not including text for not deleted as this doesn't really add much value.
	//else where.push(not(eq(budget.status, 'deleted')));
	if (restFilter.deleted) stringArray.push(`Is Deleted`);
	if (restFilter.disabled) stringArray.push(`Is Disabled`);
	if (restFilter.allowUpdate) stringArray.push(`Can Be Updated`);
	if (restFilter.active) stringArray.push(`Is Active`);
	if (restFilter.importIdArray && restFilter.importIdArray.length > 0)
		stringArray.push(
			await arrayToText({
				data: restFilter.importIdArray,
				singularName: 'Import',
				inputToText: importIdsToTitles
			})
		);
	if (restFilter.importDetailIdArray && restFilter.importDetailIdArray.length > 0)
		stringArray.push(
			await arrayToText({
				data: restFilter.importDetailIdArray,
				singularName: 'Import Detail ID'
			})
		);

	if (stringArray.length === 0 && allText) {
		stringArray.push('Showing All');
	}

	if (prefix) {
		return stringArray.map((item) => `${prefix} ${item}`);
	}

	return stringArray;
};
