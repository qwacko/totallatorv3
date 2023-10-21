import type { CategoryFilterSchemaType } from '$lib/schema/categorySchema';
import { db } from '../../db';
import { category } from '../../schema';
import { SQL, eq, ilike, inArray, like, not } from 'drizzle-orm';
import { arrayToText } from './arrayToText';
import { importIdsToTitles } from './importIdsToTitles';

export const categoryFilterToQuery = (
	filter: Omit<CategoryFilterSchemaType, 'page' | 'pageSize' | 'orderBy'>
) => {
	const restFilter = filter;

	const where: SQL<unknown>[] = [];
	if (restFilter.id) where.push(eq(category.id, restFilter.id));
	if (restFilter.idArray && restFilter.idArray.length > 0)
		where.push(inArray(category.id, restFilter.idArray));
	if (restFilter.title) where.push(like(category.title, `%${restFilter.title}%`));
	if (restFilter.group) where.push(ilike(category.title, `%${restFilter.group}%`));
	if (restFilter.single) where.push(ilike(category.title, `%${restFilter.single}%`));
	if (restFilter.status) where.push(eq(category.status, restFilter.status));
	else where.push(not(eq(category.status, 'deleted')));
	if (restFilter.deleted) where.push(eq(category.deleted, restFilter.deleted));
	if (restFilter.disabled) where.push(eq(category.disabled, restFilter.disabled));
	if (restFilter.allowUpdate) where.push(eq(category.allowUpdate, restFilter.allowUpdate));
	if (restFilter.active) where.push(eq(category.active, restFilter.active));
	if (restFilter.importIdArray && restFilter.importIdArray.length > 0)
		where.push(inArray(category.importId, restFilter.importIdArray));
	if (restFilter.importDetailIdArray && restFilter.importDetailIdArray.length > 0)
		where.push(inArray(category.importDetailId, restFilter.importDetailIdArray));

	return where;
};

const categoryIdToTitle = async (id: string) => {
	const foundCategory = await db
		.select({ title: category.title })
		.from(category)
		.where(eq(category.id, id))
		.limit(1)
		.execute();

	if (foundCategory?.length === 1) {
		return foundCategory[0].title;
	}
	return id;
};

const categoryIdsToTitle = async (ids: string[]) => {
	const titles = await Promise.all(ids.map(async (id) => categoryIdToTitle(id)));

	return titles;
};

export const categoryFilterToText = async (
	filter: Omit<CategoryFilterSchemaType, 'page' | 'pageSize' | 'orderBy'>,

	{ prefix, allText = true }: { prefix?: string; allText?: boolean } = {}
) => {
	const restFilter = filter;

	const stringArray: string[] = [];
	if (restFilter.id) stringArray.push(`Is ${await categoryIdToTitle(restFilter.id)}`);
	if (restFilter.idArray && restFilter.idArray.length > 0) {
		if (restFilter.idArray.length === 1) {
			stringArray.push(`Is ${await categoryIdToTitle(restFilter.idArray[0])}`);
		} else {
			stringArray.push(`Is One Of ${(await categoryIdsToTitle(restFilter.idArray)).join(',')}`);
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
