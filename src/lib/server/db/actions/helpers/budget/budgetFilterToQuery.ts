import type { BudgetFilterSchemaWithoutPaginationType } from '$lib/schema/budgetSchema';
import type { DBType } from '../../../db';
import { budget } from '../../../postgres/schema';
import {
	budgetMaterializedView,
	journalExtendedView,
	journalView
} from '../../../postgres/schema/materializedViewSchema';
import { SQL, eq } from 'drizzle-orm';
import {
	summaryFilterToQueryMaterialized,
	summaryFilterToText
} from '../summary/summaryFilterToQuery';
import { idTitleFilterToQueryMapped, idTitleFilterToText } from '../misc/filterToQueryTitleIDCore';
import { statusFilterToQueryMapped, statusFilterToText } from '../misc/filterToQueryStatusCore';
import {
	importFilterToQueryMaterialized,
	importFilterToText
} from '../misc/filterToQueryImportCore';
import { filterToQueryFinal } from '../misc/filterToQueryFinal';
import { processBudgetTextFilter } from './budgetTextFilter';
import { linkedFileFilterQuery, linkedFileFilterToText } from '../file/fileFilterToQuery';
import { linkedNoteFilterQuery, linkedNoteFilterToText } from '../note/noteFilterToQuery';
import { dbExecuteLogger } from '$lib/server/db/dbLogger';

export const budgetFilterToQuery = ({
	filter,
	target = 'budget'
}: {
	filter: BudgetFilterSchemaWithoutPaginationType;
	target?: 'budget' | 'budgetWithSummary' | 'materializedJournals' | 'viewJournals';
}) => {
	const restFilter = processBudgetTextFilter.process(filter);
	const includeSummary = target === 'budgetWithSummary';
	const viewJournals = target === 'viewJournals';
	const materializedJournals = target === 'materializedJournals';

	const targetTable = viewJournals
		? {
				id: journalView.budgetId,
				title: journalView.budgetTitle,
				status: journalView.budgetStatus,
				disabled: journalView.budgetDisabled,
				allowUpdate: journalView.budgetAllowUpdate,
				active: journalView.budgetActive
			}
		: materializedJournals
			? {
					id: journalExtendedView.budgetId,
					title: journalExtendedView.budgetTitle,
					status: journalExtendedView.budgetStatus,
					disabled: journalExtendedView.budgetDisabled,
					allowUpdate: journalExtendedView.budgetAllowUpdate,
					active: journalExtendedView.budgetActive
				}
			: budgetMaterializedView;

	const where: SQL<unknown>[] = [];
	idTitleFilterToQueryMapped({
		where,
		filter: restFilter,
		idColumn: targetTable.id,
		titleColumn: targetTable.title
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
				importId: budgetMaterializedView.importId,
				importDetailId: budgetMaterializedView.importDetailId
			}
		});
	}

	if (includeSummary && !viewJournals && !materializedJournals) {
		linkedFileFilterQuery({
			where,
			filter: restFilter,
			fileCountColumn: budgetMaterializedView.fileCount
		});
		linkedNoteFilterQuery({
			where,
			filter: restFilter,
			noteCountColumn: budgetMaterializedView.noteCount,
			reminderCountColumn: budgetMaterializedView.reminderCount
		});
		summaryFilterToQueryMaterialized({
			where,
			filter: restFilter,
			table: {
				count: budgetMaterializedView.count,
				sum: budgetMaterializedView.sum,
				firstDate: budgetMaterializedView.firstDate,
				lastDate: budgetMaterializedView.lastDate
			}
		});
	}

	return where;
};

export const budgetIdToTitle = async (db: DBType, id: string) => {
	const foundBudget = await dbExecuteLogger(
		db.select({ title: budget.title }).from(budget).where(eq(budget.id, id)).limit(1),
		'budgetIdToTitle'
	);

	if (foundBudget?.length === 1) {
		return foundBudget[0].title;
	}
	return id;
};

export const budgetFilterToText = async ({
	filter,
	db,
	prefix,
	allText = true
}: {
	db: DBType;
	filter: BudgetFilterSchemaWithoutPaginationType;
	prefix?: string;
	allText?: boolean;
}) => {
	const restFilter = processBudgetTextFilter.process(filter);

	const stringArray: string[] = [];
	await idTitleFilterToText(db, stringArray, restFilter, budgetIdToTitle);
	statusFilterToText(stringArray, restFilter);
	linkedFileFilterToText(restFilter, stringArray);
	linkedNoteFilterToText(restFilter, stringArray);
	importFilterToText(db, stringArray, restFilter);
	summaryFilterToText({ stringArray, filter: restFilter });
	return filterToQueryFinal({ stringArray, allText, prefix });
};
