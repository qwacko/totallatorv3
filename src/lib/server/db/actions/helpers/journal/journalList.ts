import {
	journalFilterSchema,
	defaultJournalFilter,
	type JournalFilterSchemaInputType
} from '$lib/schema/journalSchema';
import { getTableColumns, eq, and, inArray, sum, sql, not, or } from 'drizzle-orm';
import type { DBType } from '../../../db';
import {
	account,
	journalEntry,
	bill,
	budget,
	category,
	tag,
	label,
	labelsToJournals,
	importTable,
	importItemDetail
} from '../../../postgres/schema';
import { journalExtendedView } from '../../../postgres/schema/materializedViewSchema';
import { journalFilterToQuery } from './journalFilterToQuery';
import { journalFilterToOrderBy } from './journalFilterToOrderBy';
import { count as drizzleCount } from 'drizzle-orm';
import { materializedJournalFilterToQuery } from '../journalMaterializedView/materializedJournalFilterToQuery';
import { materializedJournalFilterToOrderBy } from '../journalMaterializedView/materializedJournalFilterToOrderBy';
import { alias } from 'drizzle-orm/pg-core';
import type { AccountTypeEnumType } from '$lib/schema/accountTypeSchema';

type LabelColumnType = { labelToJournalId: string; id: string; title: string }[];
type OtherJournalsColumnType = {
	id: string;
	transactionId: string;
	accountId: string;
	accountTitle: string;
	accountType: AccountTypeEnumType;
	accountGroup: string;
	amount: number;
}[];

const getOtherJournalInfo = async (db: DBType, journalIds: string[]) => {
	const labelsq = db.$with('labelsq').as(
		db
			.select({
				journalId: labelsToJournals.journalId,
				labelData:
					sql<LabelColumnType>`COALESCE(jsonb_agg(jsonb_build_object('labelToJournalId', ${labelsToJournals.id}, 'id', ${labelsToJournals.labelId}, 'title', ${label.title})), '[]'::jsonb)`.as(
						'labelData'
					)
			})
			.from(labelsToJournals)
			.leftJoin(label, eq(labelsToJournals.labelId, label.id))
			.where(journalIds.length > 0 ? inArray(labelsToJournals.journalId, journalIds) : sql`FALSE`)
			.groupBy(labelsToJournals.journalId)
	);

	const otherJournals = alias(journalEntry, 'otherJournal');

	const journalsq = db.$with('journalsq').as(
		db
			.select({
				journalId: journalEntry.id,
				otherJournalData:
					sql<OtherJournalsColumnType>`COALESCE(jsonb_agg(jsonb_build_object('id', ${otherJournals.id}, 'transactionId', ${otherJournals.transactionId}, 'accountId', ${account.id}, 'accountTitle', ${account.title}, 'accountType', ${account.type}, 'accountGroup', ${account.accountGroupCombined}, 'amount', ${otherJournals.amount})), '[]'::jsonb)`.as(
						'otherJournalData'
					)
			})
			.from(journalEntry)
			.leftJoin(otherJournals, eq(otherJournals.transactionId, journalEntry.transactionId))
			.leftJoin(account, eq(otherJournals.accountId, account.id))
			.where(
				and(
					not(eq(otherJournals.id, journalEntry.id)),
					journalIds.length > 0 ? inArray(journalEntry.id, journalIds) : sql`FALSE`
				)
			)
			.groupBy(journalEntry.id)
	);

	const otherJournalInformation = await db
		.with(labelsq, journalsq)
		.select({
			id: journalEntry.id,
			labels: sql<LabelColumnType>`COALESCE(${labelsq.labelData},'[]'::JSONB)`.as('labelData'),
			otherJournals:
				sql<OtherJournalsColumnType>`COALESCE(${journalsq.otherJournalData},'[]'::JSONB)`.as(
					'otherJournalData'
				)
		})
		.from(journalEntry)
		.where(journalIds.length > 0 ? inArray(journalEntry.id, journalIds) : sql`FALSE`)
		.leftJoin(labelsq, eq(journalEntry.id, labelsq.journalId))
		.leftJoin(journalsq, eq(journalEntry.id, journalsq.journalId))
		.execute();

	return otherJournalInformation;
};

export const journalMaterialisedList = async ({
	db,
	filter
}: {
	db: DBType;
	filter: JournalFilterSchemaInputType;
}) => {
	const processedFilter = journalFilterSchema.catch(defaultJournalFilter()).parse(filter);

	const { page = 0, pageSize = 10, ...restFilter } = processedFilter;

	const journalQueryCore = db
		.select()
		.from(journalExtendedView)
		.where(and(...(await materializedJournalFilterToQuery(db, restFilter))))
		.orderBy(...materializedJournalFilterToOrderBy(processedFilter))
		.offset(page * pageSize)
		.limit(pageSize);

	const journalsPromise = journalQueryCore.execute();

	// console.log(otherInfo);

	const runningTotalInner = db
		.select({ amount: journalExtendedView.amount })
		.from(journalExtendedView)
		.where(and(...(await materializedJournalFilterToQuery(db, restFilter))))
		.orderBy(...materializedJournalFilterToOrderBy(processedFilter))
		.offset(page * pageSize)
		.as('sumInner');

	const runningTotalPromise = db
		.select({ sum: sum(runningTotalInner.amount).mapWith(Number) })
		.from(runningTotalInner)
		.execute();

	const resultCount = await db
		.select({
			count: drizzleCount(journalExtendedView.id)
		})
		.from(journalExtendedView)
		.where(and(...(await materializedJournalFilterToQuery(db, restFilter))))
		.execute();

	const count = resultCount[0].count;
	const pageCount = Math.max(1, Math.ceil(count / pageSize));

	const journals = await journalsPromise;
	const journalIds = journals.map((item) => item.id);

	const runningTotal = (await runningTotalPromise)[0].sum;

	const otherJournalData = await getOtherJournalInfo(db, journalIds);
	const importDetails = await db
		.select()
		.from(importItemDetail)
		.where(
			or(
				inArray(importItemDetail.relationId, journalIds),
				inArray(importItemDetail.relation2Id, journalIds)
			)
		)
		.execute();

	const journalsMerged = journals.map((journal, index) => {
		const priorJournals = journals.filter((_, i) => i < index);
		const priorJournalTotal = priorJournals.reduce((prev, current) => prev + current.amount, 0);
		const thisOtherJournalData = otherJournalData.find((x) => x.id === journal.id);
		const thisImportDetail = importDetails.find(
			(x) => x.relationId === journal.id || x.relation2Id === journal.id
		);
		const total = runningTotal - priorJournalTotal;

		return {
			...journal,
			total,
			otherJournals: thisOtherJournalData?.otherJournals ?? [],
			importDetail: thisImportDetail?.processedInfo,
			labels: thisOtherJournalData?.labels ?? []
		};
	});

	return {
		count,
		data: journalsMerged,
		pageCount,
		page,
		pageSize,
		runningTotal
	};
};

export const journalList = async ({
	db,
	filter
}: {
	db: DBType;
	filter: JournalFilterSchemaInputType;
}) => {
	const processedFilter = journalFilterSchema.catch(defaultJournalFilter()).parse(filter);

	const { page = 0, pageSize = 10, ...restFilter } = processedFilter;

	const journalQueryCore = db
		.select({
			...getTableColumns(journalEntry),
			tagTitle: tag.title,
			billTitle: bill.title,
			budgetTitle: budget.title,
			categoryTitle: category.title,
			accountTitle: account.title,
			accountType: account.type,
			accountGroup: account.accountGroupCombined,
			importTitle: importTable.title
		})
		.from(journalEntry)
		.leftJoin(account, eq(journalEntry.accountId, account.id))
		.leftJoin(bill, eq(journalEntry.billId, bill.id))
		.leftJoin(budget, eq(journalEntry.budgetId, budget.id))
		.leftJoin(category, eq(journalEntry.categoryId, category.id))
		.leftJoin(tag, eq(journalEntry.tagId, tag.id))
		.leftJoin(importTable, eq(journalEntry.importId, importTable.id))
		.where(and(...(await journalFilterToQuery(db, restFilter))))
		.orderBy(...journalFilterToOrderBy(processedFilter))
		.offset(page * pageSize)
		.limit(pageSize);

	const journalsPromise = journalQueryCore.execute();

	const runningTotalInner = db
		.select({
			amount: getTableColumns(journalEntry).amount
		})
		.from(journalEntry)
		.leftJoin(account, eq(journalEntry.accountId, account.id))
		.leftJoin(bill, eq(journalEntry.billId, bill.id))
		.leftJoin(budget, eq(journalEntry.budgetId, budget.id))
		.leftJoin(category, eq(journalEntry.categoryId, category.id))
		.leftJoin(tag, eq(journalEntry.tagId, tag.id))
		.leftJoin(importTable, eq(journalEntry.importId, importTable.id))
		.where(and(...(await journalFilterToQuery(db, restFilter))))
		.orderBy(...journalFilterToOrderBy(processedFilter))
		.offset(page * pageSize)
		// .limit(-1)
		.as('sumInner');

	const runningTotalPromise = db
		.select({ sum: sum(runningTotalInner.amount).mapWith(Number) })
		.from(runningTotalInner)
		.execute();

	const resultCount = await db
		.select({
			count: drizzleCount(journalEntry.id)
		})
		.from(journalEntry)
		.leftJoin(account, eq(journalEntry.accountId, account.id))
		.leftJoin(bill, eq(journalEntry.billId, bill.id))
		.leftJoin(budget, eq(journalEntry.budgetId, budget.id))
		.leftJoin(category, eq(journalEntry.categoryId, category.id))
		.leftJoin(tag, eq(journalEntry.tagId, tag.id))
		.where(and(...(await journalFilterToQuery(db, restFilter))))
		.execute();

	const count = resultCount[0].count;
	const pageCount = Math.max(1, Math.ceil(count / pageSize));

	const journals = await journalsPromise;

	const journalIds = journals.map((item) => item.id);

	const journalLabels = await db
		.select({ journalId: journalEntry.id, labelId: label.id, labelTitle: label.title })
		.from(journalEntry)
		.leftJoin(labelsToJournals, eq(labelsToJournals.journalId, journalEntry.id))
		.leftJoin(label, eq(label.id, labelsToJournals.labelId))
		.where(
			journalIds.length > 0 ? inArray(journalEntry.id, journalIds) : eq(journalEntry.id, 'None')
		)
		.execute();

	const runningTotal = (await runningTotalPromise)[0].sum;

	const transactionIds = journals.map((journal) => journal.transactionId);

	const transactionJournals =
		transactionIds.length > 0
			? await db
					.select({
						id: journalEntry.id,
						transactionId: journalEntry.transactionId,
						accountId: journalEntry.accountId,
						accountTitle: account.title,
						accountType: account.type,
						accountGroup: account.accountGroupCombined,
						amount: journalEntry.amount
					})
					.from(journalEntry)
					.leftJoin(account, eq(journalEntry.accountId, account.id))
					.where(inArray(journalEntry.transactionId, transactionIds))
					.execute()
			: [];

	const journalsMerged = journals.map((journal, index) => {
		const otherJournals = transactionJournals.filter(
			(x) => x.transactionId === journal.transactionId && x.id !== journal.id
		);
		const priorJournals = journals.filter((_, i) => i < index);
		const priorJournalTotal = priorJournals.reduce((prev, current) => prev + current.amount, 0);
		const total = runningTotal - priorJournalTotal;
		const labels = journalLabels
			.filter((item) => item.journalId === journal.id)
			.map((item) => ({ id: item.labelId, title: item.labelTitle }));

		return {
			...journal,
			total,
			otherJournals,
			labels
		};
	});

	return {
		count,
		data: journalsMerged,
		pageCount,
		page,
		pageSize,
		runningTotal
	};
};
