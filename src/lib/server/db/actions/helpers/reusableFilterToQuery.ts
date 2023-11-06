import type { ReusableFilterFilterSchemaType } from '$lib/schema/reusableFilterSchema';
import { reusableFilter } from '$lib/server/db/schema';
import { SQL, eq, inArray, like, or } from 'drizzle-orm';

export const reusableFilterToQuery = (filter: ReusableFilterFilterSchemaType) => {
	const restFilter = filter;

	const where: SQL<unknown>[] = [];
	if (restFilter.id) where.push(eq(reusableFilter.id, restFilter.id));
	if (restFilter.idArray && restFilter.idArray.length > 0)
		where.push(inArray(reusableFilter.id, restFilter.idArray));
	if (restFilter.title) where.push(like(reusableFilter.title, `%${restFilter.title}%`));
	if (restFilter.multipleText) {
		const orValue = or(
			like(reusableFilter.title, `%${restFilter.multipleText}%`),
			like(reusableFilter.filterText, `%${restFilter.multipleText}%`),
			like(reusableFilter.changeText, `%${restFilter.multipleText}%`)
		);
		if (orValue) {
			where.push(orValue);
		}
	}
	if (restFilter.applyAutomatically)
		where.push(eq(reusableFilter.applyAutomatically, restFilter.applyAutomatically));
	if (restFilter.applyFollowingImport)
		where.push(eq(reusableFilter.applyFollowingImport, restFilter.applyFollowingImport));
	if (restFilter.listed) where.push(eq(reusableFilter.listed, restFilter.listed));
	if (restFilter.modificationType)
		where.push(eq(reusableFilter.modificationType, restFilter.modificationType));
	if (restFilter.filterText)
		where.push(like(reusableFilter.filterText, `%${restFilter.filterText}%`));
	if (restFilter.changeText)
		where.push(like(reusableFilter.changeText, `%${restFilter.changeText}%`));

	return where;
};

export const reusableFilterToText = (filter: ReusableFilterFilterSchemaType) => {
	const restFilter = filter;

	const text: string[] = [];
	if (restFilter.id) text.push(`id = ${restFilter.id}`);
	if (restFilter.idArray && restFilter.idArray.length > 0)
		text.push(`id in (${restFilter.idArray.join(',')})`);
	if (restFilter.title) text.push(`title like ${restFilter.title}`);
	if (restFilter.multipleText) text.push(`Title / Filter / Change like ${restFilter.multipleText}`);
	if (restFilter.applyAutomatically)
		text.push(`applyAutomatically = ${restFilter.applyAutomatically}`);
	if (restFilter.applyFollowingImport)
		text.push(`applyFollowingImport = ${restFilter.applyFollowingImport}`);
	if (restFilter.listed) text.push(`listed = ${restFilter.listed}`);
	if (restFilter.modificationType) text.push(`modificationType = ${restFilter.modificationType}`);
	if (restFilter.filterText) text.push(`filterText like ${restFilter.filterText}`);
	if (restFilter.changeText) text.push(`changeText like ${restFilter.changeText}`);

	if (text.length === 0) {
		text.push('No Filters Applied');
	}

	return text;
};
