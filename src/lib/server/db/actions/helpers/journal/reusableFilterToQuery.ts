import type { ReusableFilterFilterSchemaType } from '$lib/schema/reusableFilterSchema';
import { reusableFilter } from '$lib/server/db/postgres/schema';
import { SQL, eq, inArray, ilike, or } from 'drizzle-orm';

export const reusableFilterToQuery = (filter: ReusableFilterFilterSchemaType) => {
	const restFilter = filter;

	const where: SQL<unknown>[] = [];
	if (restFilter.id) where.push(eq(reusableFilter.id, restFilter.id));
	if (restFilter.idArray && restFilter.idArray.length > 0)
		where.push(inArray(reusableFilter.id, restFilter.idArray));
	if (restFilter.title) where.push(ilike(reusableFilter.title, `%${restFilter.title}%`));
	if (restFilter.group) where.push(ilike(reusableFilter.group, `%${restFilter.group}%`));
	if (restFilter.multipleText) {
		const orValue = or(
			ilike(reusableFilter.title, `%${restFilter.multipleText}%`),
			ilike(reusableFilter.filterText, `%${restFilter.multipleText}%`),
			ilike(reusableFilter.changeText, `%${restFilter.multipleText}%`),
			ilike(reusableFilter.group, `%${restFilter.multipleText}%`)
		);
		if (orValue) {
			where.push(orValue);
		}
	}
	if (restFilter.applyAutomatically !== undefined)
		where.push(eq(reusableFilter.applyAutomatically, restFilter.applyAutomatically));
	if (restFilter.applyFollowingImport !== undefined)
		where.push(eq(reusableFilter.applyFollowingImport, restFilter.applyFollowingImport));
	if (restFilter.listed !== undefined) where.push(eq(reusableFilter.listed, restFilter.listed));
	if (restFilter.modificationType)
		where.push(eq(reusableFilter.modificationType, restFilter.modificationType));
	if (restFilter.filterText)
		where.push(ilike(reusableFilter.filterText, `%${restFilter.filterText}%`));
	if (restFilter.changeText)
		where.push(ilike(reusableFilter.changeText, `%${restFilter.changeText}%`));

	return where;
};

export const reusableFilterToText = (filter: ReusableFilterFilterSchemaType) => {
	const restFilter = filter;

	const text: string[] = [];
	if (restFilter.id) text.push(`id = ${restFilter.id}`);
	if (restFilter.idArray && restFilter.idArray.length > 0)
		text.push(`id in (${restFilter.idArray.join(',')})`);
	if (restFilter.multipleText) {
		text.push(`Group / Title / Filter / Change like ${restFilter.multipleText}`);
	}
	if (restFilter.title) text.push(`title like ${restFilter.title}`);
	if (restFilter.group) text.push(`group like ${restFilter.group}`);
	if (restFilter.applyAutomatically !== undefined)
		text.push(`Automatic = ${restFilter.applyAutomatically}`);
	if (restFilter.applyFollowingImport !== undefined)
		text.push(`Import = ${restFilter.applyFollowingImport}`);
	if (restFilter.listed !== undefined) text.push(`In Dropdown = ${restFilter.listed}`);
	if (restFilter.modificationType) text.push(`modificationType = ${restFilter.modificationType}`);
	if (restFilter.filterText) text.push(`filterText like ${restFilter.filterText}`);
	if (restFilter.changeText) text.push(`changeText like ${restFilter.changeText}`);

	if (text.length === 0) {
		text.push('No Filters Applied');
	}

	return text;
};
