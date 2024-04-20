import {
	journalFilterSchema,
	defaultJournalFilter,
	type JournalFilterSchemaInputType
} from '$lib/schema/journalSchema';
import { eq, and, sum, sql, not, or } from 'drizzle-orm';
import type { DBType } from '../../../db';
import {
	account,
	journalEntry,
	label,
	labelsToJournals,
	importItemDetail
} from '../../../postgres/schema';
import { journalExtendedView } from '../../../postgres/schema/materializedViewSchema';
import { count as drizzleCount } from 'drizzle-orm';
import { materializedJournalFilterToQuery } from '../journalMaterializedView/materializedJournalFilterToQuery';
import { materializedJournalFilterToOrderBy } from '../journalMaterializedView/materializedJournalFilterToOrderBy';
import { alias } from 'drizzle-orm/pg-core';
import type { AccountTypeEnumType } from '$lib/schema/accountTypeSchema';
import { inArrayWrapped } from '../misc/inArrayWrapped';
import { tActions } from '../../tActions';
import { filterNullUndefinedAndDuplicates } from '$lib/helpers/filterNullUndefinedAndDuplicates';
import { sqlToText } from '../printMaterializedViewList';
import { logging } from '$lib/server/logging';
import { dbExecuteLogger } from '$lib/server/db/dbLogger';

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
			.where(inArrayWrapped(labelsToJournals.journalId, journalIds))
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
				and(not(eq(otherJournals.id, journalEntry.id)), inArrayWrapped(journalEntry.id, journalIds))
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
		.where(inArrayWrapped(journalEntry.id, journalIds))
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

	const andFilter = await materializedJournalFilterToQuery(db, restFilter);
	const orderBy = materializedJournalFilterToOrderBy(processedFilter);

	const journalQueryCore = db
		.select()
		.from(journalExtendedView)
		.where(and(...andFilter))
		.orderBy(...orderBy)
		.offset(page * pageSize)
		.limit(pageSize);

	if (false) {
		logging.debug(sqlToText(journalQueryCore.getSQL()));
	}

	const journalsPromise = dbExecuteLogger(journalQueryCore);

	const runningTotalInner = db
		.select({ amount: journalExtendedView.amount })
		.from(journalExtendedView)
		.where(and(...andFilter))
		.orderBy(...orderBy)
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
		.where(and(...andFilter))
		.execute();

	const count = resultCount[0].count;
	const pageCount = Math.max(1, Math.ceil(count / pageSize));

	const journals = await journalsPromise;
	const journalIds = journals.map((item) => item.id);
	const transactionIds = filterNullUndefinedAndDuplicates(
		journals.map((item) => item.transactionId)
	);

	const transactionNotes = await tActions.note.listGrouped({
		db,
		ids: transactionIds,
		grouping: 'transaction'
	});

	const transactionFiles = await tActions.file.listGrouped({
		db,
		ids: transactionIds,
		grouping: 'transaction'
	});

	const runningTotal = (await runningTotalPromise)[0].sum;

	//Logic to prevent querying too much data if the page size is too large
	const limitedJournalIds = journalIds.slice(0, 500);

	const otherJournalData = await getOtherJournalInfo(db, limitedJournalIds);
	const importDetails = await db
		.select()
		.from(importItemDetail)
		.where(
			or(
				inArrayWrapped(importItemDetail.relationId, limitedJournalIds),
				inArrayWrapped(importItemDetail.relation2Id, limitedJournalIds)
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
		const notes = journal.transactionId ? transactionNotes[journal.transactionId] : undefined;
		const files = journal.transactionId ? transactionFiles[journal.transactionId] : undefined;

		return {
			...journal,
			total,
			otherJournals: thisOtherJournalData?.otherJournals ?? [],
			importDetail: thisImportDetail?.processedInfo,
			labels: thisOtherJournalData?.labels ?? [],
			notes: notes ?? [],
			files: files ?? []
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
