import type {
	CreateBillSchemaType,
	BillFilterSchemaType,
	UpdateBillSchemaType
} from '$lib/schema/billSchema';
import { nanoid } from 'nanoid';
import type { DBType } from '../db';
import { bill } from '../postgres/schema';
import { and, asc, desc, eq, inArray } from 'drizzle-orm';
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
import { billMaterializedView } from '../postgres/schema/materializedViewSchema';

export const billActions = {
	getById: async (db: DBType, id: string) => {
		return db.query.bill.findFirst({ where: eq(bill.id, id) }).execute();
	},
	count: async (db: DBType, filter?: BillFilterSchemaType) => {
		await materializedViewActions.conditionalRefresh({ db });
		const count = await db
			.select({ count: drizzleCount(bill.id) })
			.from(billMaterializedView)
			.where(and(...(filter ? billFilterToQuery({ filter, target: 'billWithSummary' }) : [])))
			.execute();

		return count[0].count;
	},
	listWithTransactionCount: async (db: DBType) => {
		await materializedViewActions.conditionalRefresh({ db });
		const items = db
			.select({ id: billMaterializedView.id, journalCount: billMaterializedView.count })
			.from(billMaterializedView)
			.execute();

		return items;
	},
	list: async ({ db, filter }: { db: DBType; filter: BillFilterSchemaType }) => {
		await materializedViewActions.conditionalRefresh({ db });
		const { page = 0, pageSize = 10, orderBy, ...restFilter } = filter;

		const where = billFilterToQuery({ filter: restFilter, target: 'billWithSummary' });

		const defaultOrderBy = [asc(billMaterializedView.title), desc(billMaterializedView.createdAt)];

		const orderByResult = orderBy
			? [
					...orderBy.map((currentOrder) =>
						currentOrder.direction === 'asc'
							? asc(billMaterializedView[currentOrder.field])
							: desc(billMaterializedView[currentOrder.field])
					),
					...defaultOrderBy
				]
			: defaultOrderBy;

		const results = await db
			.select()
			.from(billMaterializedView)
			.where(and(...where))
			.limit(pageSize)
			.offset(page * pageSize)
			.orderBy(...orderByResult)
			.execute();

		const resultCount = await db
			.select({ count: drizzleCount(bill.id) })
			.from(billMaterializedView)
			.where(and(...where))
			.execute();

		const count = resultCount[0].count;
		const pageCount = Math.max(1, Math.ceil(count / pageSize));

		return { count, data: results, pageCount, page, pageSize };
	},
	listForDropdown: async ({ db }: { db: DBType }) => {
		await testingDelay();
		await streamingDelay();
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
				: await db.query.bill.findFirst({ where: eq(bill.id, id) }).execute();

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
				: await db.query.bill.findFirst({ where: eq(bill.title, title) }).execute();
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

		await materializedViewActions.setRefreshRequired(db);
		return id;
	},
	createMany: async (db: DBType, data: CreateBillSchemaType[]) => {
		const ids = data.map(() => nanoid());
		const insertData = data.map((currentData, index) =>
			billCreateInsertionData(currentData, ids[index])
		);
		await db.insert(bill).values(insertData).execute();

		await materializedViewActions.setRefreshRequired(db);
		return ids;
	},
	update: async (db: DBType, data: UpdateBillSchemaType) => {
		const { id } = data;
		const currentBill = await db.query.bill.findFirst({ where: eq(bill.id, id) }).execute();

		if (!currentBill) {
			logging.error('Update Bill: Bill not found', data);
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
			await db
				.delete(bill)
				.where(
					inArray(
						bill.id,
						itemsForDeletion.map((item) => item.id)
					)
				)
				.execute();
			await materializedViewActions.setRefreshRequired(db);
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
