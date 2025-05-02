import {
	and,
	eq,
	isNotNull,
	isNull,
	or,
	asc,
	desc,
	getTableColumns,
	count as drizzleCount
} from 'drizzle-orm';
import type { DBType } from '../db';
import {
	account,
	category,
	budget,
	tag,
	label,
	associatedInfoTable,
	bill,
	fileTable,
	journalSnapshotTable,
	notesTable,
	user,
	journalEntry
} from '../postgres/schema';
import { inArrayWrapped } from './helpers/misc/inArrayWrapped';
import {
	fileRelationshipKeys,
	type KeysOfCreateFileNoteRelationshipSchemaType
} from '$lib/schema/helpers/fileNoteRelationship';
import { dbExecuteLogger } from '../dbLogger';
import { materializedViewActions } from './materializedViewActions';
import type { AssociatedInfoFilterSchemaWithPaginationType } from '$lib/schema/associatedInfoSchema';
import { associatedInfoFilterToQuery } from './helpers/associatedInfo/associatedInfoFilterToQuery';
import type { PaginatedResults } from './helpers/journal/PaginationType';

type UpdateLinkedFunction = (data: { db: DBType }) => Promise<void>;
type RemoveUnnecessaryFunction = (data: { db: DBType }) => Promise<void>;
type ListAsscociatedInfoFunction = (data: {
	db: DBType;
	filter: AssociatedInfoFilterSchemaWithPaginationType;
}) => Promise<PaginatedResults<AssociatedInfoReturnType>>;

type AssociatedInfoReturnType = {
	id: string;
	title: string | null;
	accountId: string | null;
	accountTitle: string | null;
	billId: string | null;
	billTitle: string | null;
	budgetId: string | null;
	budgetTitle: string | null;
	tagId: string | null;
	tagTitle: string | null;
	categoryId: string | null;
	categoryTitle: string | null;
	transactionId: string | null;
	labelId: string | null;
	labelTitle: string | null;
	createdAt: Date;
	updatedAt: Date;
	linked: boolean;
	createdBy: string | null;
	notes: (typeof notesTable.$inferSelect)[];
	files: (typeof fileTable.$inferSelect)[];
	journalSnapshots: (typeof journalSnapshotTable.$inferSelect)[];
	transaction: {
		journals: (typeof journalEntry.$inferSelect)[];
	} | null;
};

export const associatedInfoActions: {
	removeUnnecessary: RemoveUnnecessaryFunction;
	updateLinked: UpdateLinkedFunction;
	list: ListAsscociatedInfoFunction;
} = {
	removeUnnecessary: async ({ db }) => {
		const itemsToDelete = await db
			.select({ id: associatedInfoTable.id, fileId: fileTable.id, noteId: notesTable.id })
			.from(associatedInfoTable)
			.leftJoin(fileTable, eq(associatedInfoTable.id, fileTable.associatedInfoId))
			.leftJoin(notesTable, eq(associatedInfoTable.id, notesTable.associatedInfoId))
			.where(and(isNull(fileTable.associatedInfoId), isNull(notesTable.associatedInfoId)));

		if (itemsToDelete.length > 0) {
			await db.delete(associatedInfoTable).where(
				inArrayWrapped(
					associatedInfoTable.id,
					itemsToDelete.map((item) => item.id)
				)
			);
		}
	},
	updateLinked: async ({ db }) => {
		await dbExecuteLogger(
			db
				.update(associatedInfoTable)
				.set({ linked: false })
				.where(
					and(
						eq(associatedInfoTable.linked, true),
						...fileRelationshipKeys.map((key) =>
							isNull(
								associatedInfoTable[key as unknown as KeysOfCreateFileNoteRelationshipSchemaType]
							)
						)
					)
				),
			'File - Update Linked - False'
		);

		await dbExecuteLogger(
			db
				.update(associatedInfoTable)
				.set({ linked: true })
				.where(
					and(
						eq(associatedInfoTable.linked, false),
						or(
							...fileRelationshipKeys.map((key) =>
								isNotNull(
									associatedInfoTable[key as unknown as KeysOfCreateFileNoteRelationshipSchemaType]
								)
							)
						)
					)
				),
			'File - Update Linked - True'
		);

		await materializedViewActions.setRefreshRequired(db);
	},
	list: async ({ db, filter }) => {
		const { page = 0, pageSize = 10, orderBy, ...filterWithoutPagination } = filter;

		const where = associatedInfoFilterToQuery({ filter: filterWithoutPagination });
		const defaultOrderBy = [desc(associatedInfoTable.createdAt)];

		const orderByResult = orderBy
			? [
					...orderBy.map((currentOrder) => {
						const directionOrder = currentOrder.direction === 'asc' ? asc : desc;
						if (currentOrder.field === 'account') {
							return directionOrder(account.title);
						}
						if (currentOrder.field === 'bill') {
							return directionOrder(bill.title);
						}
						if (currentOrder.field === 'budget') {
							return directionOrder(budget.title);
						}
						if (currentOrder.field === 'tag') {
							return directionOrder(tag.title);
						}
						if (currentOrder.field === 'category') {
							return directionOrder(category.title);
						}
						return directionOrder(associatedInfoTable[currentOrder.field]);
					}),
					...defaultOrderBy
				]
			: defaultOrderBy;

		const results = await dbExecuteLogger(
			db
				.select({
					...getTableColumns(associatedInfoTable),
					accountTitle: account.title,
					billTitle: bill.title,
					budgetTitle: budget.title,
					tagTitle: tag.title,
					categoryTitle: category.title,
					labelTitle: label.title,
					createdBy: user.name
				})
				.from(associatedInfoTable)
				.leftJoin(account, eq(associatedInfoTable.accountId, account.id))
				.leftJoin(bill, eq(associatedInfoTable.billId, bill.id))
				.leftJoin(budget, eq(associatedInfoTable.budgetId, budget.id))
				.leftJoin(tag, eq(associatedInfoTable.tagId, tag.id))
				.leftJoin(category, eq(associatedInfoTable.categoryId, category.id))
				.leftJoin(label, eq(associatedInfoTable.labelId, label.id))
				.leftJoin(user, eq(associatedInfoTable.createdById, user.id))
				.where(and(...where))
				.limit(pageSize)
				.offset(page * pageSize)
				.orderBy(...orderByResult)
		);

		const foundIds = results.map((result) => result.id);

		const additionalInfo = await dbExecuteLogger(
			db.query.associatedInfoTable.findMany({
				where: (targetTable, { inArray }) => inArray(targetTable.id, foundIds),
				columns: {
					id: true
				},
				with: {
					notes: true,
					files: true,
					journalSnapshots: true,
					transaction: { with: { journals: true } }
				}
			})
		);

		const resultsWithAdditionalInfo = results.map((result) => {
			const additionalInfoItem = additionalInfo.find((item) => item.id === result.id);
			const additionalInfoUse: typeof additionalInfoItem = additionalInfoItem || {
				id: result.id,
				notes: [],
				files: [],
				journalSnapshots: [],
				transaction: null
			};
			return {
				...result,
				...additionalInfoUse
			};
		});

		const resultCount = await dbExecuteLogger(
			db
				.select({ count: drizzleCount(associatedInfoTable.id) })
				.from(associatedInfoTable)
				.leftJoin(account, eq(associatedInfoTable.accountId, account.id))
				.leftJoin(bill, eq(associatedInfoTable.billId, bill.id))
				.leftJoin(budget, eq(associatedInfoTable.budgetId, budget.id))
				.leftJoin(tag, eq(associatedInfoTable.tagId, tag.id))
				.leftJoin(category, eq(associatedInfoTable.categoryId, category.id))
				.where(and(...where)),
			'Bill - List - Count'
		);

		const count = resultCount[0].count;
		const pageCount = Math.max(1, Math.ceil(count / pageSize));

		return { count, data: resultsWithAdditionalInfo, pageCount, page, pageSize };
	}
};
