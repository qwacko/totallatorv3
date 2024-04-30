import type { CategoryFilterSchemaType } from '$lib/schema/categorySchema';
import type { DBType } from '$lib/server/db/db';
import { category } from '$lib/server/db/postgres/schema';
import {
	categoryMaterializedView,
	journalExtendedView,
	journalView
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
import { linkedFileFilterQuery, linkedFileFilterToText } from '../file/fileFilterToQuery';
import { linkedNoteFilterQuery, linkedNoteFilterToText } from '../note/noteFilterToQuery';
import { dbExecuteLogger } from '$lib/server/db/dbLogger';

export const categoryFilterToQuery = ({
	filter,
	target = 'category'
}: {
	filter: Omit<CategoryFilterSchemaType, 'page' | 'pageSize' | 'orderBy'>;
	target?: 'category' | 'categoryWithSummary' | 'materializedJournals' | 'viewJournals';
}) => {
	const restFilter = processCategoryTextFilter.process(filter);
	const includeSummary = target === 'categoryWithSummary';
	const viewJournals = target === 'viewJournals';
	const materializedJournals = target === 'materializedJournals';

	const targetTable = viewJournals
		? {
				id: journalView.categoryId,
				title: journalView.categoryTitle,
				single: journalView.categorySingle,
				group: journalView.categoryGroup,
				status: journalView.categoryStatus,
				disabled: journalView.categoryDisabled,
				allowUpdate: journalView.categoryAllowUpdate,
				active: journalView.categoryActive
			}
		: materializedJournals
			? {
					id: journalExtendedView.categoryId,
					title: journalExtendedView.categoryTitle,
					single: journalExtendedView.categorySingle,
					group: journalExtendedView.categoryGroup,
					status: journalExtendedView.categoryStatus,
					disabled: journalExtendedView.categoryDisabled,
					allowUpdate: journalExtendedView.categoryAllowUpdate,
					active: journalExtendedView.categoryActive
				}
			: categoryMaterializedView;

	const where: SQL<unknown>[] = [];
	idTitleFilterToQueryMapped({
		where,
		filter: restFilter,
		idColumn: targetTable.id,
		titleColumn: targetTable.title,
		groupColumn: targetTable.group,
		singleColumn: targetTable.single
	});
	statusFilterToQueryMapped({
		where,
		filter: restFilter,
		statusColumn: targetTable.status,
		disabledColumn: targetTable.disabled,
		activeColumn: targetTable.active,
		allowUpdateColumn: targetTable.allowUpdate
	});

	if (!materializedJournals && !viewJournals) {
		importFilterToQueryMaterialized({
			where,
			filter: restFilter,
			table: {
				importId: categoryMaterializedView.importId,
				importDetailId: categoryMaterializedView.importDetailId
			}
		});
	}

	if (includeSummary && !viewJournals && !materializedJournals) {
		linkedFileFilterQuery({
			where,
			filter: restFilter,
			fileCountColumn: categoryMaterializedView.fileCount
		});
		linkedNoteFilterQuery({
			where,
			filter: restFilter,
			noteCountColumn: categoryMaterializedView.noteCount,
			reminderCountColumn: categoryMaterializedView.reminderCount
		});
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
	const foundCategory = await dbExecuteLogger(
		db.select({ title: category.title }).from(category).where(eq(category.id, id)).limit(1),
		'categoryIdToTitle'
	);

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
	linkedFileFilterToText(restFilter, stringArray);
	linkedNoteFilterToText(restFilter, stringArray);
	importFilterToText(db, stringArray, restFilter);
	summaryFilterToText({ stringArray, filter: restFilter });
	return filterToQueryFinal({ stringArray, allText, prefix });
};
