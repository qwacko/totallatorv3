import type { CategoryFilterSchemaType } from '$lib/schema/categorySchema';
import type { DBType } from '$lib/server/db/db';
import { category, journalExtendedView } from '$lib/server/db/postgres/schema';
import { SQL, eq } from 'drizzle-orm';

import { summaryFilterToQuery, summaryFilterToText } from '../summary/summaryFilterToQuery';
import { statusFilterToQueryMapped, statusFilterToText } from '../misc/filterToQueryStatusCore';
import { importFilterToQuery, importFilterToText } from '../misc/filterToQueryImportCore';
import { idTitleFilterToQueryMapped, idTitleFilterToText } from '../misc/filterToQueryTitleIDCore';
import { filterToQueryFinal } from '../misc/filterToQueryFinal';

export const categoryFilterToQuery = ({
	filter,
	target = 'category'
}: {
	filter: Omit<CategoryFilterSchemaType, 'page' | 'pageSize' | 'orderBy'>;
	target?: 'category' | 'categoryWithSummary' | 'materializedJournals';
}) => {
	const restFilter = filter;
	const includeSummary = target === 'categoryWithSummary';
	const materializedJournals = target === 'materializedJournals';

	const where: SQL<unknown>[] = [];
	idTitleFilterToQueryMapped({
		where,
		filter,
		idColumn: materializedJournals ? journalExtendedView.categoryId : category.id,
		titleColumn: materializedJournals ? journalExtendedView.categoryTitle : category.title,
		groupColumn: materializedJournals ? journalExtendedView.categoryGroup : category.group,
		singleColumn: materializedJournals ? journalExtendedView.categorySingle : category.single
	});
	statusFilterToQueryMapped({
		where,
		filter,
		statusColumn: materializedJournals ? journalExtendedView.categoryStatus : category.status,
		disabledColumn: materializedJournals ? journalExtendedView.categoryDisabled : category.disabled,
		activeColumn: materializedJournals ? journalExtendedView.categoryActive : category.active,
		allowUpdateColumn: materializedJournals
			? journalExtendedView.categoryAllowUpdate
			: category.allowUpdate
	});

	if (!materializedJournals) {
		importFilterToQuery(where, filter, 'category');
	}

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
	importFilterToText(db, stringArray, filter);
	summaryFilterToText({ stringArray, filter: restFilter });
	return filterToQueryFinal({ stringArray, allText, prefix });
};
