import type {
	CreateBillSchemaType,
	BillFilterSchemaType,
	UpdateBillSchemaType
} from '$lib/schema/billSchema';
import { nanoid } from 'nanoid';
import type { DBType } from '../db';
import { bill } from '../schema';
import { SQL, and, asc, desc, eq, like, not, sql } from 'drizzle-orm';
import { statusUpdate } from './helpers/statusUpdate';
import { combinedTitleSplit, combinedTitleSplitRequired } from '$lib/helpers/combinedTitleSplit';
import { updatedTime } from './helpers/updatedTime';
import type { IdSchemaType } from '$lib/schema/idSchema';
import { logging } from '$lib/server/logging';

export const billActions = {
	getById: async (db: DBType, id: string) => {
		return db.query.bill.findFirst({ where: eq(bill.id, id) }).execute();
	},
	list: async (db: DBType, filter: BillFilterSchemaType) => {
		const { page = 0, pageSize = 10, orderBy, ...restFilter } = filter;

		const where: SQL<unknown>[] = [];
		if (restFilter.id) where.push(eq(bill.id, restFilter.id));
		if (restFilter.title) where.push(like(bill.title, `%${restFilter.title}%`));
		if (restFilter.status) where.push(eq(bill.status, restFilter.status));
		else where.push(not(eq(bill.status, 'deleted')));
		if (restFilter.deleted) where.push(eq(bill.deleted, restFilter.deleted));
		if (restFilter.disabled) where.push(eq(bill.disabled, restFilter.disabled));
		if (restFilter.allowUpdate) where.push(eq(bill.allowUpdate, restFilter.allowUpdate));
		if (restFilter.active) where.push(eq(bill.active, restFilter.active));

		const defaultOrderBy = [asc(bill.title), desc(bill.createdAt)];

		const orderByResult = orderBy
			? [
					...orderBy.map((currentOrder) =>
						currentOrder.direction === 'asc'
							? asc(bill[currentOrder.field])
							: desc(bill[currentOrder.field])
					),
					...defaultOrderBy
			  ]
			: defaultOrderBy;

		const results = db.query.bill
			.findMany({
				where: and(...where),
				offset: page * pageSize,
				limit: pageSize,
				orderBy: orderByResult
			})
			.execute();

		const resultCount = await db
			.select({ count: sql<number>`count(${bill.id})`.mapWith(Number) })
			.from(bill)
			.where(and(...where))
			.execute();

		const count = resultCount[0].count;
		const pageCount = Math.max(1, Math.ceil(count / pageSize));

		return { count, data: await results, pageCount, page, pageSize };
	},
	create: async (db: DBType, data: CreateBillSchemaType) => {
		const id = nanoid();
		await db
			.insert(bill)
			.values({
				id,
				...statusUpdate(data.status),
				...updatedTime(),
				...combinedTitleSplitRequired(data)
			})
			.execute();

		return id;
	},
	update: async (db: DBType, data: UpdateBillSchemaType) => {
		const { id } = data;
		const currentBill = await db.query.bill.findFirst({ where: eq(bill.id, id) }).execute();
		logging.info('Update Bill: ', data, currentBill);

		if (!currentBill || currentBill.status === 'deleted') {
			logging.info('Update Bill: Bill not found or deleted');
			return id;
		}

		if (data.status && data.status === 'deleted') {
			logging.info('Update Bill: Cannot Use Update To Set To Deleted');
			return id;
		}

		await db
			.update(bill)
			.set({
				...statusUpdate(data.status),
				...updatedTime(),
				...combinedTitleSplit(data)
			})
			.where(eq(bill.id, id))
			.execute();

		return id;
	},
	delete: async (db: DBType, data: IdSchemaType) => {
		const currentBill = await db.query.bill
			.findFirst({ where: eq(bill.id, data.id), with: { journals: { limit: 1 } } })
			.execute();

		// If the bill has no journals, then mark as deleted, otherwise do nothing
		if (currentBill && currentBill.journals.length === 0) {
			await db
				.update(bill)
				.set({ ...statusUpdate('deleted'), ...updatedTime() })
				.where(eq(bill.id, data.id))
				.execute();
		}

		return data.id;
	},
	undelete: async (db: DBType, data: IdSchemaType) => {
		const currentBill = await db.query.bill.findFirst({ where: eq(bill.id, data.id) }).execute();
		if (currentBill && currentBill.deleted) {
			await db
				.update(bill)
				.set({ ...statusUpdate('active'), ...updatedTime() })
				.where(eq(bill.id, data.id))
				.execute();
		}
	}
};
