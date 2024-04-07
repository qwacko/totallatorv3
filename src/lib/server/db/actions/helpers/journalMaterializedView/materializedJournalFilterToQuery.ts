import type { JournalFilterSchemaWithoutPaginationType } from '$lib/schema/journalSchema';
import { journalExtendedView } from '../../../postgres/schema/materializedViewSchema';
import { SQL, eq, gte, lte, ilike, not, inArray, notInArray } from 'drizzle-orm';
import { accountFilterToQuery } from '../account/accountFilterToQuery';
import { billFilterToQuery } from '../bill/billFilterToQuery';
import { budgetFilterToQuery } from '../budget/budgetFilterToQuery';
import { tagFilterToQuery } from '../tag/tagFilterToQuery';
import { categoryFilterToQuery } from '../category/categoryFilterToQuery';
import { labelFilterToSubQuery } from '../label/labelFilterToQuery';
import { type DBType } from '../../../db';
import { journalPayeeToSubquery } from '../journal/journalPayeeToSubquery';
import { dateSpanInfo } from '$lib/schema/dateSpanSchema';
import { ilikeArrayWrapped, inArrayWrapped, notInArrayWrapped } from '../misc/inArrayWrapped';
import { processJournalTextFilter } from '../journal/processJournalTextFilter';

export const materializedJournalFilterToQuery = async (
	db: DBType,
	filterIn: JournalFilterSchemaWithoutPaginationType,
	{
		excludeStart = false,
		excludeEnd = false,
		excludeSpan = false,
		firstMonthOfFY = 1
	}: {
		excludeStart?: boolean;
		excludeEnd?: boolean;
		excludeSpan?: boolean;
		firstMonthOfFY?: number;
	} = {}
) => {
	const filter = processJournalTextFilter.process(JSON.parse(JSON.stringify(filterIn)));

	const where: SQL<unknown>[] = [];

	if (filter.id) where.push(eq(journalExtendedView.id, filter.id));
	if (filter.excludeId) where.push(not(eq(journalExtendedView.id, filter.excludeId)));
	if (filter.idArray && filter.idArray.length > 0)
		where.push(inArrayWrapped(journalExtendedView.id, filter.idArray));
	if (filter.excludeIdArray && filter.excludeIdArray.length > 0)
		where.push(notInArrayWrapped(journalExtendedView.id, filter.excludeIdArray));
	if (filter.maxAmount !== undefined) where.push(lte(journalExtendedView.amount, filter.maxAmount));
	if (filter.minAmount !== undefined) where.push(gte(journalExtendedView.amount, filter.minAmount));
	if (filter.yearMonth && filter.yearMonth.length > 0)
		where.push(inArrayWrapped(journalExtendedView.yearMonth, filter.yearMonth));
	if (filter.excludeYearMonth && filter.excludeYearMonth.length > 0)
		where.push(notInArrayWrapped(journalExtendedView.yearMonth, filter.excludeYearMonth));
	if (filter.transactionIdArray && filter.transactionIdArray.length > 0)
		where.push(inArrayWrapped(journalExtendedView.transactionId, filter.transactionIdArray));
	if (filter.excludeTransactionIdArray && filter.excludeTransactionIdArray.length > 0)
		where.push(
			notInArrayWrapped(journalExtendedView.transactionId, filter.excludeTransactionIdArray)
		);
	if (filter.description)
		where.push(ilike(journalExtendedView.description, `%${filter.description}%`));
	if (filter.excludeDescription)
		where.push(not(ilike(journalExtendedView.description, `%${filter.excludeDescription}%`)));
	if (filter.descriptionArray && filter.descriptionArray.length > 0) {
		where.push(ilikeArrayWrapped(journalExtendedView.description, filter.descriptionArray));
	}
	if (filter.excludeDescriptionArray && filter.excludeDescriptionArray.length > 0) {
		where.push(
			not(ilikeArrayWrapped(journalExtendedView.description, filter.excludeDescriptionArray))
		);
	}
	if (!excludeStart && filter.dateAfter)
		where.push(gte(journalExtendedView.dateText, filter.dateAfter));
	if (!excludeEnd && filter.dateBefore)
		where.push(lte(journalExtendedView.dateText, filter.dateBefore));
	if (!excludeSpan && filter.dateSpan) {
		const dateSpan = dateSpanInfo[filter.dateSpan];
		const startDate = dateSpan.getStartDate({ currentDate: new Date(), firstMonthOfFY });
		const endDate = dateSpan.getEndDate({ currentDate: new Date(), firstMonthOfFY });

		where.push(gte(journalExtendedView.date, startDate));
		where.push(lte(journalExtendedView.date, endDate));
	}
	if (filter.transfer !== undefined) where.push(eq(journalExtendedView.transfer, filter.transfer));
	if (filter.complete !== undefined) where.push(eq(journalExtendedView.complete, filter.complete));
	if (filter.linked !== undefined) where.push(eq(journalExtendedView.linked, filter.linked));
	if (filter.dataChecked !== undefined)
		where.push(eq(journalExtendedView.dataChecked, filter.dataChecked));
	if (filter.reconciled !== undefined)
		where.push(eq(journalExtendedView.reconciled, filter.reconciled));
	if (filter.importIdArray && filter.importIdArray.length > 0)
		where.push(inArrayWrapped(journalExtendedView.importId, filter.importIdArray));
	if (filter.importDetailIdArray && filter.importDetailIdArray.length > 0)
		where.push(inArrayWrapped(journalExtendedView.importDetailId, filter.importDetailIdArray));

	if (filter.account) {
		if (filter.account.id) {
			where.push(eq(journalExtendedView.accountId, filter.account.id));
		}
		if (filter.account.idArray && filter.account.idArray.length > 0) {
			where.push(inArrayWrapped(journalExtendedView.accountId, filter.account.idArray));
		}
	}

	if (filter.account) {
		const accountFilter = accountFilterToQuery({
			filter: filter.account,
			target: 'materializedJournals'
		});
		where.push(...accountFilter);
	}
	if (filter.excludeAccount) {
		const excludeAccountFilter = accountFilterToQuery({
			filter: filter.excludeAccount,
			target: 'materializedJournals'
		});
		where.push(...excludeAccountFilter.map((x) => not(x)));
	}

	if (filter.bill) {
		const billFilter = billFilterToQuery({ filter: filter.bill, target: 'materializedJournals' });
		where.push(...billFilter);
	}
	if (filter.excludeBill) {
		const excludeBillFilter = billFilterToQuery({
			filter: filter.excludeBill,
			target: 'materializedJournals'
		});
		where.push(...excludeBillFilter.map((x) => not(x)));
	}

	if (filter.budget) {
		const budgetFilter = budgetFilterToQuery({
			filter: filter.budget,
			target: 'materializedJournals'
		});
		where.push(...budgetFilter);
	}
	if (filter.excludeBudget) {
		const excludeBudgetFilter = budgetFilterToQuery({
			filter: filter.excludeBudget,
			target: 'materializedJournals'
		});
		where.push(...excludeBudgetFilter.map((x) => not(x)));
	}

	if (filter.category) {
		const categoryFilter = categoryFilterToQuery({
			filter: filter.category,
			target: 'materializedJournals'
		});
		where.push(...categoryFilter);
	}
	if (filter.excludeCategory) {
		const excludeCategoryFilter = categoryFilterToQuery({
			filter: filter.excludeCategory,
			target: 'materializedJournals'
		});
		where.push(...excludeCategoryFilter.map((x) => not(x)));
	}

	if (filter.tag) {
		const tagFilter = tagFilterToQuery({ filter: filter.tag, target: 'materializedJournals' });
		where.push(...tagFilter);
	}
	if (filter.excludeTag) {
		const excludeTagFilter = tagFilterToQuery({
			filter: filter.excludeTag,
			target: 'materializedJournals'
		});
		where.push(...excludeTagFilter.map((x) => not(x)));
	}

	if (filter.label) {
		where.push(
			inArray(journalExtendedView.id, labelFilterToSubQuery({ filter: filter.label, db }))
		);
	}

	if (filter.excludeLabel) {
		where.push(
			notInArray(journalExtendedView.id, labelFilterToSubQuery({ filter: filter.excludeLabel, db }))
		);
	}

	if (filter.payee) {
		const payeeSubquery = journalPayeeToSubquery({
			payee: filter.payee,
			db
		});

		where.push(inArray(journalExtendedView.id, payeeSubquery));
	}

	if (filter.excludePayee) {
		const payeeExcludeSubquery = journalPayeeToSubquery({
			payee: filter.excludePayee,
			db
		});

		where.push(notInArray(journalExtendedView.id, payeeExcludeSubquery));
	}

	return where;
};
