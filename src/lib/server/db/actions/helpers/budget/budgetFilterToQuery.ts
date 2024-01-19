import type { BudgetFilterSchemaType } from '$lib/schema/budgetSchema';
import type { DBType } from '../../../db';
import { budget, journalExtendedView } from '../../../postgres/schema';
import { SQL, eq } from 'drizzle-orm';
import { summaryFilterToQuery, summaryFilterToText } from '../summary/summaryFilterToQuery';
import { idTitleFilterToQueryMapped, idTitleFilterToText } from '../misc/filterToQueryTitleIDCore';
import { statusFilterToQueryMapped, statusFilterToText } from '../misc/filterToQueryStatusCore';
import { importFilterToQuery, importFilterToText } from '../misc/filterToQueryImportCore';
import { filterToQueryFinal } from '../misc/filterToQueryFinal';

export const budgetFilterToQuery = ({
	filter,
	target = 'budget'
}: {
	filter: Omit<BudgetFilterSchemaType, 'page' | 'pageSize' | 'orderBy'>;
	target?: 'budget' | 'budgetWithSummary' | 'materializedJournals';
}) => {
	const restFilter = filter;
	const includeSummary = target === 'budgetWithSummary';
	const materializedJournals = target === 'materializedJournals';

	const where: SQL<unknown>[] = [];
	idTitleFilterToQueryMapped({
		where,
		filter,
		idColumn: materializedJournals ? journalExtendedView.budgetId : budget.id,
		titleColumn: materializedJournals ? journalExtendedView.budgetTitle : budget.title
	});
	statusFilterToQueryMapped({
		where,
		filter,
		statusColumn: materializedJournals ? journalExtendedView.budgetStatus : budget.status,
		disabledColumn: materializedJournals ? journalExtendedView.budgetDisabled : budget.disabled,
		activeColumn: materializedJournals ? journalExtendedView.budgetActive : budget.active,
		allowUpdateColumn: materializedJournals
			? journalExtendedView.budgetAllowUpdate
			: budget.allowUpdate
	});

	if (!materializedJournals) {
		importFilterToQuery(where, filter, 'budget');
	}

	if (includeSummary) {
		summaryFilterToQuery({ where, filter: restFilter });
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
	filter: Omit<BudgetFilterSchemaType, 'page' | 'pageSize' | 'orderBy'>;
	prefix?: string;
	allText?: boolean;
}) => {
	const restFilter = filter;

	const stringArray: string[] = [];
	await idTitleFilterToText(db, stringArray, filter, budgetIdToTitle);
	statusFilterToText(stringArray, filter);
	importFilterToText(db, stringArray, filter);
	summaryFilterToText({ stringArray, filter: restFilter });
	return filterToQueryFinal({ stringArray, allText, prefix });
};
