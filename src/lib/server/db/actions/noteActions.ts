import {
	createNoteSchema,
	type CreateNoteSchemaType,
	type NoteFilterSchemaType,
	type NoteFilterSchemaWithoutPaginationType,
	type UpdateNoteSchemaType
} from '$lib/schema/noteSchema';
import type { DBType } from '../db';
import { account, bill, notesTable, user } from '../postgres/schema';
import { noteFilterToQuery } from './helpers/note/noteFilterToQuery';
import { noteToOrderByToSQL } from './helpers/note/noteOrderByToSQL';
import { and, count as drizzleCount, eq, inArray, desc } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { updatedTime } from './helpers/misc/updatedTime';

type GroupingOptions =
	| 'transaction'
	| 'account'
	| 'bill'
	| 'budget'
	| 'category'
	| 'tag'
	| 'label'
	| 'autoImport'
	| 'report'
	| 'reportElement';

export const noteActions = {
	getById: async (db: DBType, id: string) => {
		return db.query.notesTable
			.findFirst({ where: ({ id: noteId }, { eq }) => eq(noteId, id) })
			.execute();
	},
	list: async ({ db, filter }: { db: DBType; filter: NoteFilterSchemaType }) => {
		const { page = 0, pageSize = 10, orderBy, ...restFilter } = filter;

		const where = noteFilterToQuery(restFilter);
		const orderBySQL = noteToOrderByToSQL({ orderBy });

		const results = await db
			.select()
			.from(notesTable)
			.leftJoin(account, eq(account.id, notesTable.accountId))
			.leftJoin(bill, eq(bill.id, notesTable.billId))
			.where(and(...where))
			.limit(pageSize)
			.offset(page * pageSize)
			.orderBy(...orderBySQL)
			.execute();

		const resultCount = await db
			.select({ count: drizzleCount(notesTable.id) })
			.from(notesTable)
			.where(and(...where))
			.execute();

		const count = resultCount[0].count;
		const pageCount = Math.max(1, Math.ceil(count / pageSize));

		return { count, data: results, pageCount, page, pageSize };
	},
	listWithoutPagination: async ({
		db,
		filter
	}: {
		db: DBType;
		filter: NoteFilterSchemaWithoutPaginationType;
	}) => {
		return (
			await noteActions.list({
				db,
				filter: {
					...filter,
					page: 0,
					pageSize: 1000000,
					orderBy: [{ field: 'createdAt', direction: 'desc' }]
				}
			})
		).data;
	},
	listGrouped: async ({
		db,
		ids,
		grouping
	}: {
		db: DBType;
		ids: string[];
		grouping: GroupingOptions;
	}) => {
		const items = await db
			.select({
				id: notesTable.id,
				note: notesTable.note,
				type: notesTable.type,
				createdAt: notesTable.createdAt,
				updatedAt: notesTable.updatedAt,
				createdById: notesTable.createdById,
				createdBy: user.username,
				groupingId: notesTable[`${grouping}Id`]
			})
			.from(notesTable)
			.leftJoin(user, eq(user.id, notesTable.createdById))
			.where(inArray(notesTable[`${grouping}Id`], ids))
			.orderBy(desc(notesTable.createdAt));

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
	addNotesToSingleItem: async <T extends { id: string }>({
		db,
		item,
		grouping
	}: {
		db: DBType;
		item: T;
		grouping: GroupingOptions;
	}) => {
		const ids = [item.id];
		const groupedNotes = await noteActions.listGrouped({
			db,
			ids,
			grouping
		});

		return {
			...item,
			notes: groupedNotes[item.id] || []
		};
	},
	addNotesToItems: async <T extends { id: string }>({
		db,
		data,
		grouping
	}: {
		db: DBType;
		data: { count: number; data: T[]; page: number; pageSize: number; pageCount: number };
		grouping: GroupingOptions;
	}) => {
		const ids = data.data.map((a) => a.id);
		const groupedNotes = await noteActions.listGrouped({
			db,
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
	create: async ({
		db,
		note,
		creationUserId
	}: {
		db: DBType;
		note: CreateNoteSchemaType;
		creationUserId: string;
	}) => {
		const result = createNoteSchema.safeParse(note);

		if (!result.success) {
			throw new Error('Invalid input');
		}

		const id = nanoid();

		await db
			.insert(notesTable)
			.values({
				id,
				createdById: creationUserId,
				...result.data,
				...updatedTime()
			})
			.execute();
	},
	updateMany: async ({
		db,
		filter,
		update
	}: {
		db: DBType;
		filter: NoteFilterSchemaWithoutPaginationType;
		update: UpdateNoteSchemaType;
	}) => {
		const where = noteFilterToQuery(filter);

		await db
			.update(notesTable)
			.set({
				...update,
				...updatedTime()
			})
			.where(and(...where))
			.execute();
	},
	deleteMany: async ({
		db,
		filter
	}: {
		db: DBType;
		filter: NoteFilterSchemaWithoutPaginationType;
	}) => {
		const where = noteFilterToQuery(filter);

		await db
			.delete(notesTable)
			.where(and(...where))
			.execute();
	}
};

export type GroupedNotesType = Awaited<ReturnType<typeof noteActions.listGrouped>>[string];
