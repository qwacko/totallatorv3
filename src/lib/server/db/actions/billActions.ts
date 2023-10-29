import type {
	CreateBillSchemaType,
	BillFilterSchemaType,
	UpdateBillSchemaType
} from '$lib/schema/billSchema';
import { nanoid } from 'nanoid';
import type { DBType } from '../db';
import { account, bill, journalEntry, summaryTable } from '../schema';
import { and, asc, desc, eq, getTableColumns, inArray, sql } from 'drizzle-orm';
import { statusUpdate } from './helpers/statusUpdate';
import { updatedTime } from './helpers/updatedTime';
import type { IdSchemaType } from '$lib/schema/idSchema';
import { logging } from '$lib/server/logging';
import { billCreateInsertionData } from './helpers/billCreateInsertionData';
import { billFilterToQuery } from './helpers/billFilterToQuery';
import { createBill } from './helpers/seedBillData';
import { createUniqueItemsOnly } from './helpers/createUniqueItemsOnly';
import { summaryActions, summaryTableColumnsToSelect } from './summaryActions';
import { summaryOrderBy } from './helpers/summaryOrderBy';

export const billActions = {
	getById: async (db: DBType, id: string) => {
		return db.query.bill.findFirst({ where: eq(bill.id, id) }).execute();
	},
	count: async (db: DBType, filter?: BillFilterSchemaType) => {
		const count = await db
			.select({ count: sql<number>`count(${bill.id})`.mapWith(Number) })
			.from(bill)
			.where(and(...(filter ? billFilterToQuery(filter) : [])))
			.execute();

		return count[0].count;
	},
	listWithTransactionCount: async (db: DBType) => {
		const items = db
			.select({ id: bill.id, journalCount: sql<number>`count(${journalEntry.id})` })
			.from(bill)
			.leftJoin(journalEntry, eq(journalEntry.billId, bill.id))
			.groupBy(bill.id)
			.execute();

		return items;
	},
	list: async ({ db, filter }: { db: DBType; filter: BillFilterSchemaType }) => {
		await summaryActions.updateAndCreateMany({
			db,
			ids: undefined,
			needsUpdateOnly: true,
			allowCreation: true
		});
		const { page = 0, pageSize = 10, orderBy, ...restFilter } = filter;

		const where = billFilterToQuery(restFilter, true);

		const defaultOrderBy = [asc(bill.title), desc(bill.createdAt)];

		const orderByResult = orderBy
			? [
					...orderBy.map((currentOrder) =>
						summaryOrderBy(currentOrder, (remainingOrder) => {
							return remainingOrder.direction === 'asc'
								? asc(bill[remainingOrder.field])
								: desc(bill[remainingOrder.field]);
						})
					),
					...defaultOrderBy
			  ]
			: defaultOrderBy;

		const results = await db
			.select({
				...getTableColumns(bill),
				...summaryTableColumnsToSelect
			})
			.from(bill)
			.where(and(...where))
			.limit(pageSize)
			.offset(page * pageSize)
			.orderBy(...orderByResult)
			.leftJoin(journalEntry, eq(journalEntry.billId, bill.id))
			.leftJoin(account, eq(account.id, journalEntry.accountId))
			.leftJoin(summaryTable, eq(summaryTable.relationId, bill.id))
			.groupBy(bill.id)
			.execute();

		const resultCount = await db
			.select({ count: sql<number>`count(${bill.id})`.mapWith(Number) })
			.from(bill)
			.where(and(...where))
			.execute();

		const count = resultCount[0].count;
		const pageCount = Math.max(1, Math.ceil(count / pageSize));

		return { count, data: results, pageCount, page, pageSize };
	},
	listForDropdown: async ({ db }: { db: DBType }) => {
		const items = db
			.select({ id: bill.id, title: bill.title, enabled: bill.allowUpdate })
			.from(bill)
			.execute();

		return items;
	},
	createOrGet: async ({
		db,
		title,
		id,
		requireActive = true
	}: {
		db: DBType;
		title?: string | null;
		id?: string | null;
		requireActive?: boolean;
	}) => {
		if (id) {
			const currentBill = await db.query.bill.findFirst({ where: eq(bill.id, id) }).execute();

			if (currentBill) {
				if (requireActive && currentBill.status !== 'active') {
					throw new Error(`Bill ${currentBill.title} is not active`);
				}
				return currentBill;
			}
			throw new Error(`Bill ${id} not found`);
		} else if (title) {
			const currentBill = await db.query.bill.findFirst({ where: eq(bill.title, title) }).execute();
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
			const newBill = await db.query.bill.findFirst({ where: eq(bill.id, newBillId) }).execute();
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
		await db.insert(bill).values(billCreateInsertionData(data, id)).execute();

		return id;
	},
	createMany: async (db: DBType, data: CreateBillSchemaType[]) => {
		const ids = data.map(() => nanoid());
		const insertData = data.map((currentData, index) =>
			billCreateInsertionData(currentData, ids[index])
		);
		await db.insert(bill).values(insertData).execute();

		return ids;
	},
	update: async (db: DBType, data: UpdateBillSchemaType) => {
		const { id } = data;
		const currentBill = await db.query.bill.findFirst({ where: eq(bill.id, id) }).execute();
		logging.info('Update Bill: ', data, currentBill);

		if (!currentBill) {
			logging.info('Update Bill: Bill not found');
			return id;
		}

		await db
			.update(bill)
			.set({
				...statusUpdate(data.status),
				...updatedTime(),
				title: data.title
			})
			.where(eq(bill.id, id))
			.execute();

		return id;
	},

	canDeleteMany: async (db: DBType, ids: string[]) => {
		const canDeleteList = await Promise.all(
			ids.map(async (id) => billActions.canDelete(db, { id }))
		);

		return canDeleteList.reduce((prev, current) => (current === false ? false : prev), true);
	},
	canDelete: async (db: DBType, data: IdSchemaType) => {
		const currentBill = await db.query.bill
			.findFirst({ where: eq(bill.id, data.id), with: { journals: { limit: 1 } } })
			.execute();
		if (!currentBill) {
			return true;
		}

		return currentBill && currentBill.journals.length === 0;
	},
	delete: async (db: DBType, data: IdSchemaType) => {
		if (await billActions.canDelete(db, data)) {
			await db.delete(bill).where(eq(bill.id, data.id)).execute();
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
			await db
				.delete(bill)
				.where(
					inArray(
						bill.id,
						itemsForDeletion.map((item) => item.id)
					)
				)
				.execute();
			return true;
		}
		return false;
	},
	seed: async (db: DBType, count: number) => {
		logging.info('Seeding Bills : ', count);

		const existingTitles = (
			await db.query.bill.findMany({ columns: { title: true } }).execute()
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
