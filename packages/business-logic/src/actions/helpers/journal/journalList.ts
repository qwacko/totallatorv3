import {
	journalFilterSchema,
	defaultJournalFilter,
	type JournalFilterSchemaInputType
} from '@totallator/shared';
import { eq, and, sum, sql, not, or } from 'drizzle-orm';
import type { DBType } from '@totallator/database';
import {
	account,
	journalEntry,
	label,
	labelsToJournals,
	importItemDetail,
	type JournalViewReturnType,
	type ImportItemDetailTableType
} from '@totallator/database';
import { count as drizzleCount } from 'drizzle-orm';
import { materializedJournalFilterToQuery } from '../journalMaterializedView/materializedJournalFilterToQuery';
import { materializedJournalFilterToOrderBy } from '../journalMaterializedView/materializedJournalFilterToOrderBy';
import { alias } from 'drizzle-orm/pg-core';
import type { AccountTypeEnumType } from '@totallator/shared';
import { inArrayWrapped } from '../misc/inArrayWrapped';
import { filterNullUndefinedAndDuplicates } from '@/helpers/filterNullUndefinedAndDuplicates';
import { sqlToText } from '../sqlToText';
import { getLogger } from '@/logger';
import { dbExecuteLogger } from '@/server/db/dbLogger';
import { getCorrectJournalTable } from '../../helpers/journalMaterializedView/getCorrectJournalTable';
import { noteActions, type GroupedNotesType } from '../../noteActions';
import { fileActions } from '../../fileActions';
import type { GroupedFilesType } from '../../fileActions';
import type { PaginationType } from './PaginationType';
import { associatedInfoActions, type AssociatedInfoDataType } from '../../associatedInfoActions';

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

	const otherJournalInformation = await dbExecuteLogger(
		db
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
			.leftJoin(journalsq, eq(journalEntry.id, journalsq.journalId)),
		'Journal Materialized - Other Journal Information'
	);

	return otherJournalInformation;
};

export type JournalMLExpanded = JournalViewReturnType & {
	total: number;
	labels: LabelColumnType;
	otherJournals: OtherJournalsColumnType;
	importDetail?: ImportItemDetailTableType['processedInfo'] | null;
	notes: GroupedNotesType;
	files: GroupedFilesType;
	associated: Promise<AssociatedInfoDataType[]>;
};

export type JournalMLExpandedWithPagination = PaginationType & {
	runningTotal: number;
	data: JournalMLExpanded[];
};

export const journalMaterialisedList = async ({
	db,
	filter
}: {
	db: DBType;
	filter: JournalFilterSchemaInputType;
}): Promise<JournalMLExpandedWithPagination> => {
	const processedFilter = journalFilterSchema.catch(defaultJournalFilter()).parse(filter);

	const { page = 0, pageSize = 10, ...restFilter } = processedFilter;
	const { table: targetTable, target } = await getCorrectJournalTable(db);

	const andFilter = await materializedJournalFilterToQuery(db, restFilter, { target });
	const orderBy = materializedJournalFilterToOrderBy(processedFilter, target);

	const journalQueryCore = db
		.select()
		.from(targetTable)
		.where(and(...andFilter))
		.orderBy(...orderBy)
		.offset(page * pageSize)
		.limit(pageSize);

	if (false) {
		getLogger().debug(sqlToText(journalQueryCore.getSQL()));
	}

	const journalsPromise: Promise<JournalViewReturnType[]> = dbExecuteLogger(
		journalQueryCore,
		'Journal Materialized - Data'
	);

	const runningTotalInner = db
		.select({ amount: targetTable.amount })
		.from(targetTable)
		.where(and(...andFilter))
		.orderBy(...orderBy)
		.offset(page * pageSize)
		.as('sumInner');

	const runningTotalPromise = dbExecuteLogger(
		db.select({ sum: sum(runningTotalInner.amount).mapWith(Number) }).from(runningTotalInner),
		'Journal Materialized - Running Total'
	);

	const resultCount = await dbExecuteLogger(
		db
			.select({
				count: drizzleCount(targetTable.id)
			})
			.from(targetTable)
			.where(and(...andFilter)),
		'Journal Materialized - Result Count'
	);

	const count = resultCount[0].count;
	const pageCount = Math.max(1, Math.ceil(count / pageSize));

	const journals = await journalsPromise;
	const journalIds = journals.map((item) => item.id);
	const transactionIds = filterNullUndefinedAndDuplicates(
		journals.map((item) => item.transactionId)
	);

	const transactionNotes = await noteActions.listGrouped({
		db,
		ids: transactionIds,
		grouping: 'transaction'
	});

	const transactionFiles = await fileActions.listGrouped({
		db,
		ids: transactionIds,
		grouping: 'transaction'
	});

	const associatedInfo = associatedInfoActions.listGrouped({
		db,
		ids: transactionIds,
		grouping: 'transactionId'
	});

	const runningTotal = (await runningTotalPromise)[0].sum;

	//Logic to prevent querying too much data if the page size is too large
	const limitedJournalIds = journalIds.slice(0, 500);

	const otherJournalData = await getOtherJournalInfo(db, limitedJournalIds);
	const importDetails: ImportItemDetailTableType[] = await dbExecuteLogger(
		db
			.select()
			.from(importItemDetail)
			.where(
				or(
					inArrayWrapped(importItemDetail.relationId, limitedJournalIds),
					inArrayWrapped(importItemDetail.relation2Id, limitedJournalIds)
				)
			),
		'Journal Materialized - Import Details'
	);

	const getAssociatedItems = async (id: string | null) => {
		if (!id) {
			return [];
		}
		const data = await associatedInfo;
		return data[id] || [];
	};

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
			files: files ?? [],
			associated: getAssociatedItems(journal.transactionId)
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
