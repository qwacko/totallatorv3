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
import type { DBType } from '@totallator/database';
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
	user
} from '@totallator/database';
import { inArrayWrapped } from './helpers/misc/inArrayWrapped';
import {
	fileRelationshipKeys,
	linksCanAddSummary,
	linksToFilter,
	type KeysOfCreateFileNoteRelationshipSchemaType
} from '@totallator/shared';
import { dbExecuteLogger } from '@/server/db/dbLogger';
import { materializedViewActions } from './materializedViewActions';
import type {
	AssociatedInfoFilterSchemaWithPaginationType,
	CreateAssociatedInfoSchemaType
} from '@totallator/shared';
import { associatedInfoFilterToQuery } from './helpers/associatedInfo/associatedInfoFilterToQuery';
import type { PaginatedResults } from './helpers/journal/PaginationType';
import type { GroupingIdOptions } from './helpers/file/FilesAndNotesActions';
import { nanoid } from 'nanoid';
import { updatedTime } from './helpers/misc/updatedTime';
import { fileActions } from './fileActions';
import type { CreateFileSchemaCoreType } from '@totallator/shared';
import type { CreateNoteSchemaCoreType } from '@totallator/shared';
import { noteActions } from './noteActions';
import { journalMaterializedViewActions } from './journalMaterializedViewActions';
import type { IdSchemaType } from '@totallator/shared';

type CreateAssociatedInfoFunction = (data: {
	db: DBType;
	item: CreateAssociatedInfoSchemaType;
	userId: string;
}) => Promise<string>;
type UpdateLinkedFunction = (data: { db: DBType }) => Promise<void>;
type RemoveUnnecessaryFunction = (data: { db: DBType }) => Promise<void>;

type ListAsscociatedInfoFunction = (data: {
	db: DBType;
	filter: AssociatedInfoFilterSchemaWithPaginationType;
}) => Promise<PaginatedResults<AssociatedInfoReturnType>>;

type ListGroupedFunction = (data: {
	db: DBType;
	ids: string[];
	grouping: GroupingIdOptions;
}) => Promise<Record<string, AssociatedInfoDataType[]>>;
type AddToSingleItemFunction = <T extends { id: string }>(data: {
	db: DBType;
	item: T;
	grouping: GroupingIdOptions;
}) => T & { associated: Promise<AssociatedInfoDataType[]> };
type AddToItemsFunction = <T extends { id: string }>(data: {
	db: DBType;
	data: PaginatedResults<T>;
	grouping: GroupingIdOptions;
}) => PaginatedResults<T & { associated: Promise<AssociatedInfoDataType[]> }>;
type RemoveSummaryFunction = (data: { db: DBType; data: IdSchemaType }) => Promise<void>;

export type AssociatedInfoLinkType = {
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
	transaction: {
		journals: {
			id: string;
			date: Date;
			dateText: string;
			description: string;
			account: { title: string };
		}[];
	} | null;
};

export type AssociatedInfoDataType = {
	id: string;
	title: string | null;
	createdAt: Date;
	updatedAt: Date;
	linked: boolean;
	createdById: string | null;
	notes: (typeof notesTable.$inferSelect)[];
	user: { name: string } | null;
	files: (typeof fileTable.$inferSelect)[];
	journalSnapshots: (typeof journalSnapshotTable.$inferSelect)[];
};

export type AssociatedInfoReturnType = AssociatedInfoLinkType & AssociatedInfoDataType;

export const associatedInfoActions: {
	removeUnnecessary: RemoveUnnecessaryFunction;
	updateLinked: UpdateLinkedFunction;
	list: ListAsscociatedInfoFunction;
	listGrouped: ListGroupedFunction;
	addToSingleItem: AddToSingleItemFunction;
	addToItems: AddToItemsFunction;
	create: CreateAssociatedInfoFunction;
	removeSummary: RemoveSummaryFunction;
} = {
	removeSummary: async ({ db, data }) => {
		await dbExecuteLogger(
			db.delete(journalSnapshotTable).where(eq(journalSnapshotTable.id, data.id))
		);

		await associatedInfoActions.removeUnnecessary({ db });

		return;
	},
	create: async ({ db, item, userId }) => {
		const {
			files,
			notes,
			file,
			fileTitle,
			fileReason,
			title,
			note,
			noteType,
			createSummary,
			journalSummaryFile,
			...links
		} = item;

		const associatedInfoId = nanoid();

		const linked = Object.keys(links).reduce(
			(prev, current) => prev || Boolean(links[current as keyof typeof links]),
			false
		);

		type InsertAssociatedInfo = typeof associatedInfoTable.$inferInsert;
		const associatedInfoData: InsertAssociatedInfo = {
			id: associatedInfoId,
			createdById: userId,
			...updatedTime(),
			...links,
			linked,
			title
		};

		const filesToCreate: CreateFileSchemaCoreType[] = files || [];
		if (file) {
			filesToCreate.push({
				title: fileTitle,
				reason: fileReason || 'info',
				file: file
			});
		}

		const notesToCreate: CreateNoteSchemaCoreType[] = notes || [];
		if (note) {
			notesToCreate.push({
				type: noteType || 'info',
				note: note
			});
		}

		const canAddSummary = linksCanAddSummary(links);
		const filter = linksToFilter(links);

		if (canAddSummary && createSummary && journalSummaryFile) {
			const csvData: string = await journalMaterializedViewActions.generateCSVData({
				db,
				filter,
				returnType: 'default'
			});

			const fileTitle = `journalSummary-${new Date().toISOString().slice(0, 19)}.csv`;
			const blob = new Blob([csvData], { type: 'text/csv' });
			const csvDataFile: File = new File([blob], fileTitle);

			filesToCreate.push({
				title: fileTitle,
				reason: 'summary',
				file: csvDataFile
			});
		}

		//Insert the file and associated info in a transaction to ensure atomicity
		await db.transaction(async (tx) => {
			await dbExecuteLogger(
				tx.insert(associatedInfoTable).values(associatedInfoData),
				'File - Create Associated Info'
			);

			await Promise.all(
				filesToCreate.map(async (file) =>
					fileActions.addToInfo({
						db: tx,
						associatedId: associatedInfoId,
						data: file
					})
				)
			);

			await Promise.all(
				notesToCreate.map(async (note) =>
					noteActions.addToInfo({
						db: tx,
						associatedId: associatedInfoId,
						data: note
					})
				)
			);

			if (createSummary && canAddSummary) {
				const summaryData = await journalMaterializedViewActions.simpleSummary({ db, filter });

				const newItem: typeof journalSnapshotTable.$inferInsert = {
					id: nanoid(),
					associatedInfoId,
					...updatedTime(),
					...summaryData
				};

				await dbExecuteLogger(tx.insert(journalSnapshotTable).values(newItem));
			}
		});
		await associatedInfoActions.removeUnnecessary({ db });
		return associatedInfoId;
	},
	removeUnnecessary: async ({ db }) => {
		const itemsToDelete = await db
			.select({ id: associatedInfoTable.id, fileId: fileTable.id, noteId: notesTable.id })
			.from(associatedInfoTable)
			.leftJoin(fileTable, eq(associatedInfoTable.id, fileTable.associatedInfoId))
			.leftJoin(notesTable, eq(associatedInfoTable.id, notesTable.associatedInfoId))
			.leftJoin(
				journalSnapshotTable,
				eq(associatedInfoTable.id, journalSnapshotTable.associatedInfoId)
			)
			.where(
				and(
					isNull(fileTable.associatedInfoId),
					isNull(notesTable.associatedInfoId),
					isNull(journalSnapshotTable.associatedInfoId)
				)
			);

		if (itemsToDelete.length > 0) {
			await db.delete(associatedInfoTable).where(
				inArrayWrapped(
					associatedInfoTable.id,
					itemsToDelete.map((item) => item.id)
				)
			);
		}

		await materializedViewActions.setRefreshRequired(db);
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

		await associatedInfoActions.removeUnnecessary({ db });
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
					labelTitle: label.title
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
					user: {
						columns: { name: true }
					},
					transaction: {
						with: {
							journals: {
								columns: { id: true, date: true, amount: true, dateText: true, description: true },
								with: { account: { columns: { title: true } } }
							}
						}
					}
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
				transaction: null,
				user: { name: 'Unknown' }
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
	},
	listGrouped: async ({ db, ids, grouping }) => {
		const items = await db.query.associatedInfoTable.findMany({
			where: (targetTable, { inArray }) => inArray(targetTable[grouping], ids),
			orderBy: (targetTable, { desc }) => [desc(targetTable.createdAt)],
			with: {
				files: true,
				journalSnapshots: true,
				notes: true,
				user: {
					columns: { name: true }
				}
			}
		});

		const groupedItems = items.reduce(
			(acc, item) => {
				if (!item[grouping]) return acc;
				const groupingId = item[grouping];
				if (!acc[groupingId]) {
					acc[groupingId] = [];
				}
				acc[groupingId].push(item);
				return acc;
			},
			{} as Record<string, typeof items>
		);

		return groupedItems;
	},
	addToSingleItem: ({ db, item, grouping }) => {
		const addFunction = async () => {
			const ids = [item.id];
			const groupedAssociatedInfos = await associatedInfoActions.listGrouped({
				db,
				ids,
				grouping
			});

			const key = item.id as unknown as keyof typeof groupedAssociatedInfos;

			const data: AssociatedInfoDataType[] = groupedAssociatedInfos[key] || [];

			return data;
		};

		const associated = addFunction();

		return {
			...item,
			associated
		};
	},
	addToItems: ({ db, data, grouping }) => {
		const ids = data.data.map((a) => a.id);
		const groupedAssociatedInfos = associatedInfoActions.listGrouped({
			db,
			ids,
			grouping
		});

		const addFunction = async (currentId: string) => {
			const data = await groupedAssociatedInfos;
			const thisData = data[currentId] || [];

			return thisData;
		};

		return {
			...data,
			data: data.data.map((a) => {
				return {
					...a,
					associated: addFunction(a.id)
				};
			})
		};
	}
};
