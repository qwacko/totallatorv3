import type { BudgetFilterSchemaWithoutPaginationType } from '$lib/schema/budgetSchema';
import type { DBType } from '../../../db';
import { budget } from '../../../postgres/schema';
import {
	budgetMaterializedView,
	journalExtendedView
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

export const budgetFilterToQuery = ({
	filter,
	target = 'budget'
}: {
	filter: BudgetFilterSchemaWithoutPaginationType;
	target?: 'budget' | 'budgetWithSummary' | 'materializedJournals';
}) => {
	const restFilter = processBudgetTextFilter.process(filter);
	const includeSummary = target === 'budgetWithSummary';
	const materializedJournals = target === 'materializedJournals';

	const where: SQL<unknown>[] = [];
	idTitleFilterToQueryMapped({
		where,
		filter: restFilter,
		idColumn: materializedJournals ? journalExtendedView.budgetId : budgetMaterializedView.id,
		titleColumn: materializedJournals
			? journalExtendedView.budgetTitle
			: budgetMaterializedView.title
	});
	statusFilterToQueryMapped({
		where,
		filter: restFilter,
		statusColumn: materializedJournals
			? journalExtendedView.budgetStatus
			: budgetMaterializedView.status,
		disabledColumn: materializedJournals
			? journalExtendedView.budgetDisabled
			: budgetMaterializedView.disabled,
		activeColumn: materializedJournals
			? journalExtendedView.budgetActive
			: budgetMaterializedView.active,
		allowUpdateColumn: materializedJournals
			? journalExtendedView.budgetAllowUpdate
			: budgetMaterializedView.allowUpdate
	});

	if (!materializedJournals) {
		importFilterToQueryMaterialized({
			where,
			filter: restFilter,
			table: {
				importId: budgetMaterializedView.importId,
				importDetailId: budgetMaterializedView.importDetailId
			}
		});
	}

	if (includeSummary) {
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
	const foundBudget = await db
		.select({ title: budget.title })
		.from(budget)
		.where(eq(budget.id, id))
		.limit(1)
		.execute();

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
