import { budget, bill, category, tag, label, account } from '../../../postgres/schema';
import { SQL, eq, ilike, inArray, like } from 'drizzle-orm';
import { arrayToText } from './arrayToText';
import type { DBType } from '$lib/server/db/db';

type FilterCoreType = {
	id?: string;
	idArray?: string[];
	title?: string;
	group?: string;
	single?: string;
};

export const idTitleFilterToQuery = (
	where: SQL<unknown>[],
	filter: FilterCoreType,
	type: 'bill' | 'budget' | 'category' | 'tag' | 'label' | 'account'
) => {
	const restFilter = filter;

	const usedTable =
		type === 'bill'
			? bill
			: type === 'budget'
				? budget
				: type === 'category'
					? category
					: type === 'tag'
						? tag
						: type === 'label'
							? label
							: account;

	if (restFilter.id) where.push(eq(usedTable.id, restFilter.id));
	if (restFilter.idArray && restFilter.idArray.length > 0)
		where.push(inArray(usedTable.id, restFilter.idArray));
	if (restFilter.title) where.push(like(usedTable.title, `%${restFilter.title}%`));
	if ('group' in usedTable && 'single' in usedTable) {
		if (restFilter.group) where.push(ilike(usedTable.group, `%${restFilter.group}%`));
		if (restFilter.single) where.push(ilike(usedTable.single, `%${restFilter.single}%`));
	}

	return where;
};

export const idTitleFilterToText = async (
	db: DBType,
	stringArray: string[],
	filter: FilterCoreType,
	idToTitle: (db: DBType, title: string) => Promise<string>
) => {
	const restFilter = filter;

	const idsToTitles = async (ids: string[]) => {
		return Promise.all(ids.map((id) => idToTitle(db, id)));
	};

	if (restFilter.id) stringArray.push(`Is ${await idToTitle(db, restFilter.id)}`);
	if (restFilter.idArray && restFilter.idArray.length > 0) {
		stringArray.push(
			await arrayToText({
				data: restFilter.idArray,
				inputToText: idsToTitles
			})
		);
	}
	if (restFilter.title) stringArray.push(`Title contains ${restFilter.title}`);
	if (restFilter.group) stringArray.push(`Group contains ${restFilter.group}`);
	if (restFilter.single) stringArray.push(`Single contains ${restFilter.single}`);

	return stringArray;
};
