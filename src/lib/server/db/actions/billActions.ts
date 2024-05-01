import type {
	CreateBillSchemaType,
	BillFilterSchemaType,
	UpdateBillSchemaType
} from '$lib/schema/billSchema';
import { nanoid } from 'nanoid';
import type { DBType } from '../db';
import { bill } from '../postgres/schema';
import { and, asc, desc, eq, max } from 'drizzle-orm';
import { statusUpdate } from './helpers/misc/statusUpdate';
import { updatedTime } from './helpers/misc/updatedTime';
import type { IdSchemaType } from '$lib/schema/idSchema';
import { logging } from '$lib/server/logging';
import { billCreateInsertionData } from './helpers/bill/billCreateInsertionData';
import { billFilterToQuery } from './helpers/bill/billFilterToQuery';
import { createBill } from './helpers/seed/seedBillData';
import { createUniqueItemsOnly } from './helpers/seed/createUniqueItemsOnly';
import { streamingDelay, testingDelay } from '$lib/server/testingDelay';
import { count as drizzleCount } from 'drizzle-orm';
import type { StatusEnumType } from '$lib/schema/statusSchema';
import { materializedViewActions } from './materializedViewActions';
import { inArrayWrapped } from './helpers/misc/inArrayWrapped';
import { dbExecuteLogger } from '../dbLogger';
import { getCorrectBillTable } from './helpers/bill/getCorrectBillTable';

export const billActions = {
	latestUpdate: async ({ db }: { db: DBType }) => {
		const latestUpdate = await dbExecuteLogger(
			db.select({ lastUpdated: max(bill.updatedAt) }).from(bill),
			'Bill - Latest Update'
		);
		return latestUpdate[0].lastUpdated || new Date();
	},
	getById: async (db: DBType, id: string) => {
		return dbExecuteLogger(db.query.bill.findFirst({ where: eq(bill.id, id) }), 'Bill - Get By Id');
	},
	count: async (db: DBType, filter?: BillFilterSchemaType) => {
		const { table, target } = await getCorrectBillTable(db);
		const count = await dbExecuteLogger(
			db
				.select({ count: drizzleCount(table.id) })
				.from(table)
				.where(and(...(filter ? billFilterToQuery({ filter, target }) : []))),
			'Bill - Count'
		);

		return count[0].count;
	},
	listWithTransactionCount: async (db: DBType) => {
		const { table } = await getCorrectBillTable(db);
		const items = dbExecuteLogger(
			db.select({ id: table.id, journalCount: table.count }).from(table),
			'Bill - List With Transaction Count'
		);

		return items;
	},
	list: async ({ db, filter }: { db: DBType; filter: BillFilterSchemaType }) => {
		const { table, target } = await getCorrectBillTable(db);
		const { page = 0, pageSize = 10, orderBy, ...restFilter } = filter;

		const where = billFilterToQuery({ filter: restFilter, target });

		const defaultOrderBy = [asc(table.title), desc(table.createdAt)];

		const orderByResult = orderBy
			? [
					...orderBy.map((currentOrder) =>
						currentOrder.direction === 'asc'
							? asc(table[currentOrder.field])
							: desc(table[currentOrder.field])
					),
					...defaultOrderBy
				]
			: defaultOrderBy;

		const results = await dbExecuteLogger(
			db
				.select()
				.from(table)
				.where(and(...where))
				.limit(pageSize)
				.offset(page * pageSize)
				.orderBy(...orderByResult),
			'Bill - List - Results'
		);

		const resultCount = await dbExecuteLogger(
			db
				.select({ count: drizzleCount(table.id) })
				.from(table)
				.where(and(...where)),
			'Bill - List - Count'
		);

		const count = resultCount[0].count;
		const pageCount = Math.max(1, Math.ceil(count / pageSize));

		return { count, data: results, pageCount, page, pageSize };
	},
	listForDropdown: async ({ db }: { db: DBType }) => {
		await testingDelay();
		await streamingDelay();
		const items = dbExecuteLogger(
			db.select({ id: bill.id, title: bill.title, enabled: bill.allowUpdate }).from(bill),
			'Bill - List For Dropdown'
		);

		return items;
	},
	createOrGet: async ({
		db,
		title,
		id,
		requireActive = true,
		cachedData
	}: {
		db: DBType;
		title?: string | null;
		id?: string | null;
		requireActive?: boolean;
		cachedData?: { id: string; title: string; status: StatusEnumType }[];
	}) => {
		await materializedViewActions.setRefreshRequired(db);
		if (id) {
			const currentBill = cachedData
				? cachedData.find((item) => item.id === id)
				: await dbExecuteLogger(
						db.query.bill.findFirst({ where: eq(bill.id, id) }),
						'Bill - Create Or Get - By Id'
					);

			if (currentBill) {
				if (requireActive && currentBill.status !== 'active') {
					throw new Error(`Bill ${currentBill.title} is not active`);
				}
				return currentBill;
			}
			throw new Error(`Bill ${id} not found`);
		} else if (title) {
			const currentBill = cachedData
				? cachedData.find((item) => item.title === title)
				: await dbExecuteLogger(
						db.query.bill.findFirst({ where: eq(bill.title, title) }),
						'Bill - Create Or Get - By Title'
					);
			if (currentBill) {
				if (requireActive && currentBill.status !== 'active') {
					throw new Error(`Bill ${currentBill.title} is not active`);
				}
				return currentBill;
			}
			const newBillId = await billActions.create(db, {
				title,
				status: 'active'
			});
			const newBill = await dbExecuteLogger(
				db.query.bill.findFirst({ where: eq(bill.id, newBillId) }),
				'Bill - Create Or Get - Check Created'
			);
			if (!newBill) {
				throw new Error('Error Creating Bill');
			}
			return newBill;
		} else {
			return undefined;
		}
	},
	create: async (db: DBType, data: CreateBillSchemaType) => {
		const id = nanoid();
		await dbExecuteLogger(
			db.insert(bill).values(billCreateInsertionData(data, id)),
			'Bill - Create'
		);

		await materializedViewActions.setRefreshRequired(db);
		return id;
	},
	createMany: async (db: DBType, data: CreateBillSchemaType[]) => {
		const ids = data.map(() => nanoid());
		const insertData = data.map((currentData, index) =>
			billCreateInsertionData(currentData, ids[index])
		);
		await dbExecuteLogger(db.insert(bill).values(insertData), 'Bill - Create Many');

		await materializedViewActions.setRefreshRequired(db);
		return ids;
	},
	update: async (db: DBType, data: UpdateBillSchemaType) => {
		const { id } = data;
		const currentBill = await dbExecuteLogger(
			db.query.bill.findFirst({ where: eq(bill.id, id) }),
			'Bill - Update - Get Current'
		);

		if (!currentBill) {
			logging.error('Update Bill: Bill not found', data);
			return id;
		}

		await dbExecuteLogger(
			db
				.update(bill)
				.set({
					...statusUpdate(data.status),
					...updatedTime(),
					title: data.title
				})
				.where(eq(bill.id, id)),
			'Bill - Update'
		);

		await materializedViewActions.setRefreshRequired(db);
		return id;
	},

	canDeleteMany: async (db: DBType, ids: string[]) => {
		const canDeleteList = await Promise.all(
			ids.map(async (id) => billActions.canDelete(db, { id }))
		);

		return canDeleteList.reduce((prev, current) => (current === false ? false : prev), true);
	},
	canDelete: async (db: DBType, data: IdSchemaType) => {
		const currentBill = await dbExecuteLogger(
			db.query.bill.findFirst({ where: eq(bill.id, data.id), with: { journals: { limit: 1 } } }),
			'Bill - Can Delete - Get Current'
		);
		if (!currentBill) {
			return true;
		}

		return currentBill && currentBill.journals.length === 0;
	},
	delete: async (db: DBType, data: IdSchemaType) => {
		if (await billActions.canDelete(db, data)) {
			await dbExecuteLogger(db.delete(bill).where(eq(bill.id, data.id)), 'Bill - Delete');
			await materializedViewActions.setRefreshRequired(db);
		}

		return data.id;
	},
	deleteMany: async (db: DBType, data: IdSchemaType[]) => {
		if (data.length === 0) return;
		const currentBills = await billActions.listWithTransactionCount(db);
		const itemsForDeletion = data.filter((item) => {
			const currentBill = currentBills.find((current) => current.id === item.id);
			return currentBill && currentBill.journalCount === 0;
		});
		if (itemsForDeletion.length === data.length) {
			await dbExecuteLogger(
				db.delete(bill).where(
					inArrayWrapped(
						bill.id,
						itemsForDeletion.map((item) => item.id)
					)
				),
				'Bill - Delete Many'
			);
			await materializedViewActions.setRefreshRequired(db);
			return true;
		}
		return false;
	},
	seed: async (db: DBType, count: number) => {
		logging.info('Seeding Bills : ', count);

		const existingTitles = (
			await dbExecuteLogger(
				db.query.bill.findMany({ columns: { title: true } }),
				'Bill - Seed - Get Existing'
			)
		).map((item) => item.title);
		const itemsToCreate = createUniqueItemsOnly({
			existing: existingTitles,
			creationToString: (creation) => creation.title,
			createItem: createBill,
			count
		});

		await billActions.createMany(db, itemsToCreate);
	}
};

export type BillDropdownType = Awaited<ReturnType<typeof billActions.listForDropdown>>;
