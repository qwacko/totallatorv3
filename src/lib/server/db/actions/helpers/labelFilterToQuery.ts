import type { LabelFilterSchemaType } from '$lib/schema/labelSchema';
import { db } from '../../db';
import { label } from '../../schema';
import { SQL, eq, inArray, like } from 'drizzle-orm';
import { arrayToText } from './arrayToText';
import { importIdsToTitles } from './importIdsToTitles';

export const labelFilterToQuery = (filter: LabelFilterSchemaType) => {
	const where: SQL<unknown>[] = [];
	if (filter.id) where.push(eq(label.id, filter.id));
	if (filter.idArray && filter.idArray.length > 0) where.push(inArray(label.id, filter.idArray));
	if (filter.title) where.push(like(label.title, `%${filter.title}%`));
	if (filter.status) where.push(eq(label.status, filter.status));
	if (filter.disabled) where.push(eq(label.disabled, filter.disabled));
	if (filter.allowUpdate) where.push(eq(label.allowUpdate, filter.allowUpdate));
	if (filter.active) where.push(eq(label.active, filter.active));
	if (filter.importIdArray && filter.importIdArray.length > 0)
		where.push(inArray(label.importId, filter.importIdArray));
	if (filter.importDetailIdArray && filter.importDetailIdArray.length > 0)
		where.push(inArray(label.importDetailId, filter.importDetailIdArray));

	return where;
};

const labelIdToTitle = async (id: string) => {
	const foundLabel = await db
		.select({ title: label.title })
		.from(label)
		.where(eq(label.id, id))
		.limit(1)
		.execute();

	if (foundLabel?.length === 1) {
		return foundLabel[0].title;
	}
	return id;
};

const labelIdsToTitle = async (ids: string[]) => {
	const titles = await Promise.all(ids.map(async (id) => labelIdToTitle(id)));

	return titles;
};

export const labelFilterToText = async (
	filter: Omit<LabelFilterSchemaType, 'page' | 'pageSize' | 'orderBy'>,
	{ prefix, allText = true }: { prefix?: string; allText?: boolean } = {}
) => {
	const restFilter = filter;

	const stringArray: string[] = [];
	if (restFilter.id) stringArray.push(`Is ${await labelIdToTitle(restFilter.id)}`);
	if (restFilter.idArray && restFilter.idArray.length > 0) {
		if (restFilter.idArray.length === 1) {
			stringArray.push(`Is ${await labelIdToTitle(restFilter.idArray[0])}`);
		} else {
			stringArray.push(`Is One Of ${(await labelIdsToTitle(restFilter.idArray)).join(',')}`);
		}
	}
	if (restFilter.title) stringArray.push(`Title contains ${restFilter.title}`);
	if (restFilter.status) stringArray.push(`Status equals ${restFilter.status}`);
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
