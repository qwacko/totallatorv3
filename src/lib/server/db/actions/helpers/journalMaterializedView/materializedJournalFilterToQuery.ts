import type { JournalFilterSchemaWithoutPaginationType } from '$lib/schema/journalSchema';
import { journalExtendedView, journalView } from '../../../postgres/schema/materializedViewSchema';
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
import { linkedFileFilterQuery } from '../file/fileFilterToQuery';
import { linkedNoteFilterQuery } from '../note/noteFilterToQuery';

export const materializedJournalFilterToQuery = async (
	db: DBType,
	filterIn: JournalFilterSchemaWithoutPaginationType,
	{
		excludeStart = false,
		excludeEnd = false,
		excludeSpan = false,
		firstMonthOfFY = 1,
		target = 'materialized'
	}: {
		excludeStart?: boolean;
		excludeEnd?: boolean;
		excludeSpan?: boolean;
		firstMonthOfFY?: number;
		target?: 'materialized' | 'view';
	} = {}
) => {
	const filter = processJournalTextFilter.process(JSON.parse(JSON.stringify(filterIn)));

	const where: SQL<unknown>[] = [];

	const targetTable = target === 'view' ? journalView : journalExtendedView;

	if (filter.id) where.push(eq(targetTable.id, filter.id));
	if (filter.excludeId) where.push(not(eq(targetTable.id, filter.excludeId)));
	if (filter.idArray && filter.idArray.length > 0)
		where.push(inArrayWrapped(targetTable.id, filter.idArray));
	if (filter.excludeIdArray && filter.excludeIdArray.length > 0)
		where.push(notInArrayWrapped(targetTable.id, filter.excludeIdArray));
	if (filter.maxAmount !== undefined) where.push(lte(targetTable.amount, filter.maxAmount));
	if (filter.minAmount !== undefined) where.push(gte(targetTable.amount, filter.minAmount));
	if (filter.yearMonth && filter.yearMonth.length > 0)
		where.push(inArrayWrapped(targetTable.yearMonth, filter.yearMonth));
	if (filter.excludeYearMonth && filter.excludeYearMonth.length > 0)
		where.push(notInArrayWrapped(targetTable.yearMonth, filter.excludeYearMonth));
	if (filter.transactionIdArray && filter.transactionIdArray.length > 0)
		where.push(inArrayWrapped(targetTable.transactionId, filter.transactionIdArray));
	if (filter.excludeTransactionIdArray && filter.excludeTransactionIdArray.length > 0)
		where.push(notInArrayWrapped(targetTable.transactionId, filter.excludeTransactionIdArray));
	if (filter.description) where.push(ilike(targetTable.description, `%${filter.description}%`));
	if (filter.excludeDescription)
		where.push(not(ilike(targetTable.description, `%${filter.excludeDescription}%`)));
	if (filter.descriptionArray && filter.descriptionArray.length > 0) {
		where.push(ilikeArrayWrapped(targetTable.description, filter.descriptionArray));
	}
	if (filter.excludeDescriptionArray && filter.excludeDescriptionArray.length > 0) {
		where.push(not(ilikeArrayWrapped(targetTable.description, filter.excludeDescriptionArray)));
	}
	if (!excludeStart && filter.dateAfter) where.push(gte(targetTable.dateText, filter.dateAfter));
	if (!excludeEnd && filter.dateBefore) where.push(lte(targetTable.dateText, filter.dateBefore));
	if (!excludeSpan && filter.dateSpan) {
		const dateSpan = dateSpanInfo[filter.dateSpan];
		const startDate = dateSpan.getStartDate({ currentDate: new Date(), firstMonthOfFY });
		const endDate = dateSpan.getEndDate({ currentDate: new Date(), firstMonthOfFY });

		where.push(gte(targetTable.date, startDate));
		where.push(lte(targetTable.date, endDate));
	}
	if (filter.transfer !== undefined) where.push(eq(targetTable.transfer, filter.transfer));
	if (filter.complete !== undefined) where.push(eq(targetTable.complete, filter.complete));
	if (filter.linked !== undefined) where.push(eq(targetTable.linked, filter.linked));
	if (filter.dataChecked !== undefined) where.push(eq(targetTable.dataChecked, filter.dataChecked));
	if (filter.reconciled !== undefined) where.push(eq(targetTable.reconciled, filter.reconciled));
	if (filter.llmReviewStatus !== undefined) where.push(eq(targetTable.llmReviewStatus, filter.llmReviewStatus));
	if (filter.importIdArray && filter.importIdArray.length > 0)
		where.push(inArrayWrapped(targetTable.importId, filter.importIdArray));
	if (filter.importDetailIdArray && filter.importDetailIdArray.length > 0)
		where.push(inArrayWrapped(targetTable.importDetailId, filter.importDetailIdArray));

	if (filter.account) {
		if (filter.account.id) {
			where.push(eq(targetTable.accountId, filter.account.id));
		}
		if (filter.account.idArray && filter.account.idArray.length > 0) {
			where.push(inArrayWrapped(targetTable.accountId, filter.account.idArray));
		}
	}

	if (filter.account) {
		const accountFilter = accountFilterToQuery({
			filter: filter.account,
			target: target === 'view' ? 'viewJournals' : 'materializedJournals'
		});
		where.push(...accountFilter);
	}
	if (filter.excludeAccount) {
		const excludeAccountFilter = accountFilterToQuery({
			filter: filter.excludeAccount,
			target: target === 'view' ? 'viewJournals' : 'materializedJournals'
		});
		where.push(...excludeAccountFilter.map((x) => not(x)));
	}

	if (filter.bill) {
		const billFilter = billFilterToQuery({
			filter: filter.bill,
			target: target === 'view' ? 'viewJournals' : 'materializedJournals'
		});
		where.push(...billFilter);
	}
	if (filter.excludeBill) {
		const excludeBillFilter = billFilterToQuery({
			filter: filter.excludeBill,
			target: target === 'view' ? 'viewJournals' : 'materializedJournals'
		});
		where.push(...excludeBillFilter.map((x) => not(x)));
	}

	if (filter.budget) {
		const budgetFilter = budgetFilterToQuery({
			filter: filter.budget,
			target: target === 'view' ? 'viewJournals' : 'materializedJournals'
		});
		where.push(...budgetFilter);
	}
	if (filter.excludeBudget) {
		const excludeBudgetFilter = budgetFilterToQuery({
			filter: filter.excludeBudget,
			target: target === 'view' ? 'viewJournals' : 'materializedJournals'
		});
		where.push(...excludeBudgetFilter.map((x) => not(x)));
	}

	if (filter.category) {
		const categoryFilter = categoryFilterToQuery({
			filter: filter.category,
			target: target === 'view' ? 'viewJournals' : 'materializedJournals'
		});
		where.push(...categoryFilter);
	}
	if (filter.excludeCategory) {
		const excludeCategoryFilter = categoryFilterToQuery({
			filter: filter.excludeCategory,
			target: target === 'view' ? 'viewJournals' : 'materializedJournals'
		});
		where.push(...excludeCategoryFilter.map((x) => not(x)));
	}

	if (filter.tag) {
		const tagFilter = tagFilterToQuery({
			filter: filter.tag,
			target: target === 'view' ? 'viewJournals' : 'materializedJournals'
		});
		where.push(...tagFilter);
	}
	if (filter.excludeTag) {
		const excludeTagFilter = tagFilterToQuery({
			filter: filter.excludeTag,
			target: target === 'view' ? 'viewJournals' : 'materializedJournals'
		});
		where.push(...excludeTagFilter.map((x) => not(x)));
	}

	linkedFileFilterQuery({
		where,
		filter,
		fileCountColumn: targetTable.fileCount
	});
	linkedNoteFilterQuery({
		where,
		filter,
		noteCountColumn: targetTable.noteCount,
		reminderCountColumn: targetTable.reminderCount
	});

	if (filter.label) {
		where.push(inArray(targetTable.id, labelFilterToSubQuery({ filter: filter.label, db })));
	}

	if (filter.excludeLabel) {
		where.push(
			notInArray(targetTable.id, labelFilterToSubQuery({ filter: filter.excludeLabel, db }))
		);
	}

	if (filter.payee) {
		const payeeSubquery = journalPayeeToSubquery({
			payee: filter.payee,
			db
		});

		where.push(inArray(targetTable.id, payeeSubquery));
	}

	if (filter.excludePayee) {
		const payeeExcludeSubquery = journalPayeeToSubquery({
			payee: filter.excludePayee,
			db
		});

		where.push(notInArray(targetTable.id, payeeExcludeSubquery));
	}

	return where;
};
