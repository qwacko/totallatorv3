import type {
	CreateLabelSchemaType,
	LabelFilterSchemaType,
	UpdateLabelSchemaType
} from '$lib/schema/labelSchema';
import { nanoid } from 'nanoid';
import type { DBType } from '../db';
import { label } from '../schema';
import { SQL, and, asc, desc, eq, like, not, sql } from 'drizzle-orm';
import { statusUpdate } from './helpers/statusUpdate';
import { updatedTime } from './helpers/updatedTime';
import type { IdSchemaType } from '$lib/schema/idSchema';
import { logging } from '$lib/server/logging';

export const labelActions = {
	getById: async (db: DBType, id: string) => {
		return db.query.label.findFirst({ where: eq(label.id, id) }).execute();
	},
	list: async (db: DBType, filter: LabelFilterSchemaType) => {
		const { page = 0, pageSize = 10, orderBy, ...restFilter } = filter;

		const where: SQL<unknown>[] = [];
		if (restFilter.id) where.push(eq(label.id, restFilter.id));
		if (restFilter.title) where.push(like(label.title, `%${restFilter.title}%`));
		if (restFilter.status) where.push(eq(label.status, restFilter.status));
		else where.push(not(eq(label.status, 'deleted')));
		if (restFilter.deleted) where.push(eq(label.deleted, restFilter.deleted));
		if (restFilter.disabled) where.push(eq(label.disabled, restFilter.disabled));
		if (restFilter.allowUpdate) where.push(eq(label.allowUpdate, restFilter.allowUpdate));
		if (restFilter.active) where.push(eq(label.active, restFilter.active));

		const defaultOrderBy = [asc(label.title), desc(label.createdAt)];

		const orderByResult = orderBy
			? [
					...orderBy.map((currentOrder) =>
						currentOrder.direction === 'asc'
							? asc(label[currentOrder.field])
							: desc(label[currentOrder.field])
					),
					...defaultOrderBy
			  ]
			: defaultOrderBy;

		const results = db.query.label
			.findMany({
				where: and(...where),
				offset: page * pageSize,
				limit: pageSize,
				orderBy: orderByResult
			})
			.execute();

		const resultCount = await db
			.select({ count: sql<number>`count(${label.id})`.mapWith(Number) })
			.from(label)
			.where(and(...where))
			.execute();

		const count = resultCount[0].count;
		const pageCount = Math.max(1, Math.ceil(count / pageSize));

		return { count, data: await results, pageCount, page, pageSize };
	},
	create: async (db: DBType, data: CreateLabelSchemaType) => {
		const id = nanoid();
		await db
			.insert(label)
			.values({
				id,
				...statusUpdate(data.status),
				...updatedTime(),
				title: data.title
			})
			.execute();

		return id;
	},
	update: async (db: DBType, data: UpdateLabelSchemaType) => {
		const { id } = data;
		const currentLabel = await db.query.label.findFirst({ where: eq(label.id, id) }).execute();
		logging.info('Update Label: ', data, currentLabel);

		if (!currentLabel || currentLabel.status === 'deleted') {
			logging.info('Update Label: Label not found or deleted');
			return id;
		}

		if (data.status && data.status === 'deleted') {
			logging.info('Update Label: Cannot Use Update To Set To Deleted');
			return id;
		}

		await db
			.update(label)
			.set({
				...statusUpdate(data.status),
				...updatedTime(),
				title: data.title
			})
			.where(eq(label.id, id))
			.execute();

		return id;
	},
	delete: async (db: DBType, data: IdSchemaType) => {
		const currentLabel = await db.query.label
			.findFirst({ where: eq(label.id, data.id), with: { journals: { limit: 1 } } })
			.execute();

		//If the Label has no journals, then mark as deleted, otherwise do nothing
		if (currentLabel && currentLabel.journals.length === 0) {
			await db
				.update(label)
				.set({ ...statusUpdate('deleted'), ...updatedTime() })
				.where(eq(label.id, data.id))
				.execute();
		}

		return data.id;
	},
	undelete: async (db: DBType, data: IdSchemaType) => {
		const currentLabel = await db.query.label.findFirst({ where: eq(label.id, data.id) }).execute();
		if (currentLabel && currentLabel.deleted) {
			await db
				.update(label)
				.set({ ...statusUpdate('active'), ...updatedTime() })
				.where(eq(label.id, data.id))
				.execute();
		}
	}
};
