import type { CategoryFilterSchemaType } from '$lib/schema/categorySchema';
import type { DBType } from '$lib/server/db/db';
import { category } from '$lib/server/db/postgres/schema';
import {
	categoryMaterializedView,
	journalExtendedView
} from '$lib/server/db/postgres/schema/materializedViewSchema';
import { SQL, eq } from 'drizzle-orm';

import {
	summaryFilterToQueryMaterialized,
	summaryFilterToText
} from '../summary/summaryFilterToQuery';
import { statusFilterToQueryMapped, statusFilterToText } from '../misc/filterToQueryStatusCore';
import {
	importFilterToQueryMaterialized,
	importFilterToText
} from '../misc/filterToQueryImportCore';
import { idTitleFilterToQueryMapped, idTitleFilterToText } from '../misc/filterToQueryTitleIDCore';
import { filterToQueryFinal } from '../misc/filterToQueryFinal';
import { processCategoryTextFilter } from './categoryTextFilter';

export const categoryFilterToQuery = ({
	filter,
	target = 'category'
}: {
	filter: Omit<CategoryFilterSchemaType, 'page' | 'pageSize' | 'orderBy'>;
	target?: 'category' | 'categoryWithSummary' | 'materializedJournals';
}) => {
	const restFilter = processCategoryTextFilter.process(filter);
	const includeSummary = target === 'categoryWithSummary';
	const materializedJournals = target === 'materializedJournals';

	const where: SQL<unknown>[] = [];
	idTitleFilterToQueryMapped({
		where,
		filter: restFilter,
		idColumn: materializedJournals ? journalExtendedView.categoryId : categoryMaterializedView.id,
		titleColumn: materializedJournals
			? journalExtendedView.categoryTitle
			: categoryMaterializedView.title,
		groupColumn: materializedJournals
			? journalExtendedView.categoryGroup
			: categoryMaterializedView.group,
		singleColumn: materializedJournals
			? journalExtendedView.categorySingle
			: categoryMaterializedView.single
	});
	statusFilterToQueryMapped({
		where,
		filter: restFilter,
		statusColumn: materializedJournals
			? journalExtendedView.categoryStatus
			: categoryMaterializedView.status,
		disabledColumn: materializedJournals
			? journalExtendedView.categoryDisabled
			: categoryMaterializedView.disabled,
		activeColumn: materializedJournals
			? journalExtendedView.categoryActive
			: categoryMaterializedView.active,
		allowUpdateColumn: materializedJournals
			? journalExtendedView.categoryAllowUpdate
			: categoryMaterializedView.allowUpdate
	});

	if (!materializedJournals) {
		importFilterToQueryMaterialized({
			where,
			filter: restFilter,
			table: {
				importId: categoryMaterializedView.importId,
				importDetailId: categoryMaterializedView.importDetailId
			}
		});
	}

	if (includeSummary) {
		summaryFilterToQueryMaterialized({
			where,
			filter: restFilter,
			table: {
				count: categoryMaterializedView.count,
				sum: categoryMaterializedView.sum,
				firstDate: categoryMaterializedView.firstDate,
				lastDate: categoryMaterializedView.lastDate
			}
		});
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
	const restFilter = processCategoryTextFilter.process(filter);

	const stringArray: string[] = [];
	await idTitleFilterToText(db, stringArray, restFilter, categoryIdToTitle);
	statusFilterToText(stringArray, restFilter);
	importFilterToText(db, stringArray, restFilter);
	summaryFilterToText({ stringArray, filter: restFilter });
	return filterToQueryFinal({ stringArray, allText, prefix });
};
