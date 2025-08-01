import {
	createNoteSchema,
	type CreateNoteSchemaCoreType,
	type NoteFilterSchemaType,
	type NoteFilterSchemaWithoutPaginationType,
	type UpdateNoteSchemaType
} from '@totallator/shared';
import {
	account,
	bill,
	budget,
	category,
	tag,
	label,
	autoImportTable,
	report,
	reportElement,
	notesTable,
	user,
	type NotesTableType,
	associatedInfoTable
} from '@totallator/database';
import { noteFilterToQuery, noteFilterToText } from './helpers/note/noteFilterToQuery';
import { noteToOrderByToSQL } from './helpers/note/noteOrderByToSQL';
import { and, count as drizzleCount, eq, desc, getTableColumns } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { updatedTime } from './helpers/misc/updatedTime';
import { inArrayWrapped } from './helpers/misc/inArrayWrapped';
import { materializedViewActions } from './materializedViewActions';
import { dbExecuteLogger } from '@/server/db/dbLogger';
import type { NoteTypeType } from '@totallator/shared';
import type { FilesAndNotesActions } from './helpers/file/FilesAndNotesActions';
import { filterNullUndefinedAndDuplicates } from '../helpers/filterNullUndefinedAndDuplicates';
import { associatedInfoActions } from './associatedInfoActions';
import { journalMaterializedViewActions } from './journalMaterializedViewActions';
import { accountActions } from './accountActions';
import { budgetActions } from './budgetActions';
import { categoryActions } from './categoryActions';
import { tagActions } from './tagActions';
import { labelActions } from './labelActions';
import { autoImportActions } from './autoImportActions';
import { reportActions } from './reportActions';
import { billActions } from './billActions';
import { getContextDB } from '@totallator/context';

type NotesActionsType = FilesAndNotesActions<
	NotesTableType,
	CreateNoteSchemaCoreType,
	UpdateNoteSchemaType,
	NoteFilterSchemaType,
	NoteFilterSchemaWithoutPaginationType,
	GroupedNotesType,
	{
		notes: GroupedNotesType;
	}
>;
export const noteActions: NotesActionsType = {
	getById: async (id) => {
		const db = getContextDB();
		return dbExecuteLogger(
			db.query.notesTable.findFirst({ where: ({ id: noteId }, { eq }) => eq(noteId, id) }),
			'Note - Get By Id'
		);
	},
	filterToText: async ({ filter }) => {
		return noteFilterToText({ filter });
	},
	list: async ({ filter }) => {
		const db = getContextDB();
		const { page = 0, pageSize = 10, orderBy, ...restFilter } = filter;

		const where = noteFilterToQuery(restFilter);
		const orderBySQL = noteToOrderByToSQL({ orderBy });

		//Get the table columns but exclude the duplicated ones.
		const { id, createdAt, updatedAt, ...associatedTableColumns } =
			getTableColumns(associatedInfoTable);

		const results = await dbExecuteLogger(
			db
				.select({
					...getTableColumns(notesTable),
					...associatedTableColumns,
					associatedInfoCreatedAt: associatedInfoTable.createdAt,
					associatedInfoUpdatedAt: associatedInfoTable.updatedAt,
					accountTitle: account.title,
					billTitle: bill.title,
					budgetTitle: budget.title,
					categoryTitle: category.title,
					tagTitle: tag.title,
					labelTitle: label.title,
					autoImportTitle: autoImportTable.title,
					reportTitle: report.title,
					reportElementTitle: reportElement.title,
					createdBy: user.username
				})
				.from(notesTable)
				.leftJoin(associatedInfoTable, eq(associatedInfoTable.id, notesTable.associatedInfoId))
				.leftJoin(account, eq(account.id, associatedInfoTable.accountId))
				.leftJoin(bill, eq(bill.id, associatedInfoTable.billId))
				.leftJoin(budget, eq(budget.id, associatedInfoTable.budgetId))
				.leftJoin(category, eq(category.id, associatedInfoTable.categoryId))
				.leftJoin(tag, eq(tag.id, associatedInfoTable.tagId))
				.leftJoin(label, eq(label.id, associatedInfoTable.labelId))
				.leftJoin(autoImportTable, eq(autoImportTable.id, associatedInfoTable.autoImportId))
				.leftJoin(report, eq(report.id, associatedInfoTable.reportId))
				.leftJoin(reportElement, eq(reportElement.id, associatedInfoTable.reportElementId))
				.leftJoin(user, eq(user.id, associatedInfoTable.createdById))
				.where(and(...where))
				.limit(pageSize)
				.offset(page * pageSize)
				.orderBy(...orderBySQL),
			'Note - List - Get Notes'
		);

		const transactionIdArray = filterNullUndefinedAndDuplicates(
			results.map((a) => a.transactionId)
		);

		const journalInformation =
			transactionIdArray.length > 0
				? await journalMaterializedViewActions.list({
						filter: {
							transactionIdArray,
							pageSize: 100000,
							page: 0
						}
					})
				: undefined;

		const resultsWithJournals = results.map((result) => {
			const journals = journalInformation
				? journalInformation.data.filter((a) => a.transactionId === result.transactionId)
				: [];
			return {
				...result,
				journals
			};
		});

		const resultCount = await dbExecuteLogger(
			db
				.select({ count: drizzleCount(notesTable.id) })
				.from(notesTable)
				.leftJoin(associatedInfoTable, eq(associatedInfoTable.id, notesTable.associatedInfoId))
				.where(and(...where)),
			'Note - List - Get Count'
		);

		const count = resultCount[0].count;
		const pageCount = Math.max(1, Math.ceil(count / pageSize));

		return { count, data: resultsWithJournals, pageCount, page, pageSize };
	},
	listWithoutPagination: async ({ filter }) => {
		return (
			await noteActions.list({
				filter: {
					...filter,
					page: 0,
					pageSize: 1000000,
					orderBy: [{ field: 'createdAt', direction: 'desc' }]
				}
			})
		).data;
	},
	listGrouped: async ({ ids, grouping }) => {
		const db = getContextDB();
		const items = await dbExecuteLogger(
			db
				.select({
					id: notesTable.id,
					note: notesTable.note,
					type: notesTable.type,
					createdAt: notesTable.createdAt,
					updatedAt: notesTable.updatedAt,
					createdById: associatedInfoTable.createdById,
					createdBy: user.username,
					groupingId: associatedInfoTable[`${grouping}Id`]
				})
				.from(notesTable)
				.leftJoin(associatedInfoTable, eq(associatedInfoTable.id, notesTable.associatedInfoId))
				.leftJoin(user, eq(user.id, associatedInfoTable.createdById))
				.where(inArrayWrapped(associatedInfoTable[`${grouping}Id`], ids))
				.orderBy(desc(notesTable.createdAt)),
			'Note - List Grouped - Get Notes'
		);

		const groupedItems = items.reduce(
			(acc, item) => {
				if (!item.groupingId) return acc;
				const groupingId = item.groupingId;
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
	addToSingleItem: async ({ item, grouping }) => {
		const ids = [item.id];
		const groupedNotes = await noteActions.listGrouped({
			ids,
			grouping
		});

		return {
			...item,
			notes: groupedNotes[item.id] || []
		};
	},
	addToItems: async ({ data, grouping }) => {
		const ids = data.data.map((a) => a.id);
		const groupedNotes = await noteActions.listGrouped({
			ids,
			grouping
		});

		return {
			...data,
			data: data.data.map((a) => {
				const notes = groupedNotes[a.id] || [];
				return {
					...a,
					notes
				};
			})
		};
	},
	addToInfo: async ({ data, associatedId }) => {
		const db = getContextDB();
		const noteId = nanoid();

		const insertNoteData: typeof notesTable.$inferInsert = {
			id: noteId,
			associatedInfoId: associatedId,
			note: data.note,
			type: data.type,
			...updatedTime()
		};

		await dbExecuteLogger(db.insert(notesTable).values(insertNoteData), 'Note - Create - Note');

		await materializedViewActions.setRefreshRequired();
	},
	create: async ({ data, creationUserId }) => {
		const result = createNoteSchema.safeParse(data);

		if (!result.success) {
			throw new Error('Invalid input');
		}

		const { note, type, ...links } = result.data;

		await associatedInfoActions.create({
			item: {
				...links,
				note,
				noteType: type
			},
			userId: creationUserId
		});

		await materializedViewActions.setRefreshRequired();
	},
	updateMany: async ({ filter, update }) => {
		const db = getContextDB();
		const where = noteFilterToQuery(filter);

		await dbExecuteLogger(
			db
				.update(notesTable)
				.set({
					...update,
					...updatedTime()
				})
				.where(and(...where)),
			'Note - Update Many'
		);

		await materializedViewActions.setRefreshRequired();
	},
	deleteMany: async ({ filter }) => {
		const db = getContextDB();
		const notes = await noteActions.listWithoutPagination({
			filter
		});

		const noteIds = notes.map((a) => a.id);

		await dbExecuteLogger(
			db.delete(notesTable).where(inArrayWrapped(notesTable.id, noteIds)),
			'Note - Delete Many'
		);

		await associatedInfoActions.removeUnnecessary();

		await materializedViewActions.setRefreshRequired();
	},
	getLinkedText: async ({ items }) => {
		const db = getContextDB();
		const accountTitle = items.accountId
			? await accountActions.getById(items.accountId)
			: undefined;
		const billTitle = items.billId ? await billActions.getById(items.billId) : undefined;
		const budgetTitle = items.budgetId ? await budgetActions.getById(items.budgetId) : undefined;
		const categoryTitle = items.categoryId
			? await categoryActions.getById(items.categoryId)
			: undefined;
		const tagTitle = items.tagId ? await tagActions.getById(items.tagId) : undefined;
		const labelTitle = items.labelId ? await labelActions.getById(items.labelId) : undefined;
		const autoImportTitle = items.autoImportId
			? await autoImportActions.getById({ db, id: items.autoImportId })
			: undefined;
		const reportTitle = items.reportId
			? await reportActions.getSimpleReportConfig({ db, id: items.reportId })
			: undefined;
		const reportElementTitle = items.reportElementId
			? await reportActions.reportElement.get({ db, id: items.reportElementId })
			: undefined;

		const data = {
			accountTitle: accountTitle
				? { description: 'Account', title: accountTitle.title }
				: undefined,
			billTitle: billTitle ? { description: 'Bill', title: billTitle.title } : undefined,
			budgetTitle: budgetTitle ? { description: 'Budget', title: budgetTitle.title } : undefined,
			categoryTitle: categoryTitle
				? { description: 'Category', title: categoryTitle.title }
				: undefined,
			tagTitle: tagTitle ? { description: 'Tag', title: tagTitle.title } : undefined,
			labelTitle: labelTitle ? { description: 'Label', title: labelTitle.title } : undefined,
			autoImportTitle: autoImportTitle
				? { description: 'Auto Import', title: autoImportTitle.title }
				: undefined,
			reportTitle: reportTitle ? { description: 'Report', title: reportTitle.title } : undefined,
			reportElementTitle: reportElementTitle
				? {
						description: 'Report Element',
						title: reportElementTitle.title || 'Untitled Report Element'
					}
				: undefined
		};

		return {
			data,
			text: filterNullUndefinedAndDuplicates(
				Object.keys(data).map((key) => {
					const item = data[key as keyof typeof data];
					if (!item) return undefined;
					return `${item.description} - ${item.title}`;
				})
			).join(', ')
		};
	}
};

export type GroupedNotesType = {
	id: string;
	note: string;
	type: NoteTypeType;
	createdAt: Date;
	updatedAt: Date;
	createdById: string | null;
	createdBy: string | null;
	groupingId: string | null;
}[];
