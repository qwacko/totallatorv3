import type { CategoryFilterSchemaType } from '$lib/schema/categorySchema';
import type { DBType } from '$lib/server/db/db';
import { category } from '$lib/server/db/schema';
import { SQL, eq } from 'drizzle-orm';

import { summaryFilterToQuery, summaryFilterToText } from '../summary/summaryFilterToQuery';
import { statusFilterToQuery, statusFilterToText } from '../misc/filterToQueryStatusCore';
import { importFilterToQuery, importFilterToText } from '../misc/filterToQueryImportCore';
import { idTitleFilterToQuery, idTitleFilterToText } from '../misc/filterToQueryTitleIDCore';
import { filterToQueryFinal } from '../misc/filterToQueryFinal';

export const categoryFilterToQuery = (
	filter: Omit<CategoryFilterSchemaType, 'page' | 'pageSize' | 'orderBy'>,
	includeSummary: boolean = false
) => {
	const restFilter = filter;

	const where: SQL<unknown>[] = [];
	idTitleFilterToQuery(where, filter, 'category');
	statusFilterToQuery(where, filter, 'category');
	importFilterToQuery(where, filter, 'category');

	if (includeSummary) {
		summaryFilterToQuery({ where, filter: restFilter });
	}

	return where;
};

export const categoryIdToTitle = async (db: DBType, id: string) => {
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

export const categoryFilterToText = async ({
	db,
	filter,
	prefix,
	allText = true
}: {
	db: DBType;
	filter: Omit<CategoryFilterSchemaType, 'page' | 'pageSize' | 'orderBy'>;
	prefix?: string;
	allText?: boolean;
}) => {
	const restFilter = filter;

	const stringArray: string[] = [];
	await idTitleFilterToText(db, stringArray, filter, categoryIdToTitle);
	statusFilterToText(stringArray, filter);
	importFilterToText(stringArray, filter);
	summaryFilterToText({ stringArray, filter: restFilter });
	return filterToQueryFinal({ stringArray, allText, prefix });
};
