import type {
	CreateLabelSchemaType,
	LabelFilterSchemaType,
	UpdateLabelSchemaType
} from '$lib/schema/labelSchema';
import { nanoid } from 'nanoid';
import type { DBType } from '../db';
import { journalEntry, label, labelsToJournals } from '../schema';
import { SQL, and, asc, desc, eq, inArray, like, not, sql } from 'drizzle-orm';
import { statusUpdate } from './helpers/statusUpdate';
import { updatedTime } from './helpers/updatedTime';
import type { IdSchemaType } from '$lib/schema/idSchema';
import { logging } from '$lib/server/logging';
import { createLabel } from './helpers/seedLabelData';
import { createUniqueItemsOnly } from './helpers/createUniqueItemsOnly';

const labelFilterToQuery = (filter: LabelFilterSchemaType) => {
	const where: SQL<unknown>[] = [];
	if (filter.id) where.push(eq(label.id, filter.id));
	if (filter.title) where.push(like(label.title, `%${filter.title}%`));
	if (filter.status) where.push(eq(label.status, filter.status));
	else where.push(not(eq(label.status, 'deleted')));
	if (filter.deleted) where.push(eq(label.deleted, filter.deleted));
	if (filter.disabled) where.push(eq(label.disabled, filter.disabled));
	if (filter.allowUpdate) where.push(eq(label.allowUpdate, filter.allowUpdate));
	if (filter.active) where.push(eq(label.active, filter.active));

	return where;
};

const labelCreateInsertionData = (data: CreateLabelSchemaType, id: string) => {
	return {
		id,
		title: data.title,
		...statusUpdate(data.status),
		...updatedTime()
	};
};

export const labelActions = {
	getById: async (db: DBType, id: string) => {
		return db.query.label.findFirst({ where: eq(label.id, id) }).execute();
	},
	count: async (db: DBType, filter?: LabelFilterSchemaType) => {
		const count = await db
			.select({ count: sql<number>`count(${label.id})`.mapWith(Number) })
			.from(label)
			.where(and(...(filter ? labelFilterToQuery(filter) : [])))
			.execute();

		return count[0].count;
	},
	listWithTransactionCount: async (db: DBType) => {
		const items = db
			.select({ id: label.id, journalCount: sql<number>`count(${labelsToJournals.id})` })
			.from(label)
			.leftJoin(labelsToJournals, eq(labelsToJournals.labelId, label.id))
			.groupBy(label.id)
			.execute();

		return items;
	},
	list: async ({ db, filter }: { db: DBType; filter: LabelFilterSchemaType }) => {
		const { page = 0, pageSize = 10, orderBy } = filter;

		const where = labelFilterToQuery(filter);

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
	createOrGet: async ({
		db,
		title,
		id,
		requireActive = true
	}: {
		db: DBType;
		title?: string;
		id?: string;
		requireActive?: boolean;
	}) => {
		if (id) {
			const currentLabel = await db.query.label.findFirst({ where: eq(label.id, id) }).execute();

			if (currentLabel) {
				if (requireActive && currentLabel.status !== 'active') {
					throw new Error(`Label ${currentLabel.title} is not active`);
				}
				return currentLabel;
			}
			throw new Error(`Label ${id} not found`);
		} else if (title) {
			const currentLabel = await db.query.label
				.findFirst({ where: eq(label.title, title) })
				.execute();
			if (currentLabel) {
				if (requireActive && currentLabel.status !== 'active') {
					throw new Error(`Label ${currentLabel.title} is not active`);
				}
				return currentLabel;
			}
			const newLabelId = await labelActions.create(db, {
				title,
				status: 'active'
			});
			const newLabel = await db.query.label
				.findFirst({ where: eq(label.id, newLabelId) })
				.execute();
			if (!newLabel) {
				throw new Error('Error Creating Label');
			}
			return newLabel;
		} else {
			return undefined;
		}
	},
	create: async (db: DBType, data: CreateLabelSchemaType) => {
		const id = nanoid();
		await db.insert(label).values(labelCreateInsertionData(data, id)).execute();

		return id;
	},
	createLink: async (
		db: DBType,
		{ journalId, labelId }: { journalId: string; labelId: string }
	) => {
		const id = nanoid();
		await db
			.insert(labelsToJournals)
			.values({ id, journalId, labelId, ...updatedTime() })
			.execute();
	},
	createMany: async (db: DBType, data: CreateLabelSchemaType[]) => {
		const ids = data.map(() => nanoid());
		const insertData = data.map((currentData, index) =>
			labelCreateInsertionData(currentData, ids[index])
		);

		await db.insert(label).values(insertData).execute();

		return ids;
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
	softDelete: async (db: DBType, data: IdSchemaType) => {
		return await db.transaction(async (transDb) => {
			const currentLabel = await transDb.query.label
				.findFirst({ where: eq(label.id, data.id), with: { journals: { limit: 1 } } })
				.execute();

			//If the Label has no journals, then mark as deleted, otherwise do nothing
			if (currentLabel && currentLabel.journals.length === 0) {
				await transDb
					.delete(labelsToJournals)
					.where(eq(labelsToJournals.labelId, data.id))
					.execute();

				await transDb
					.update(label)
					.set({ ...statusUpdate('deleted'), ...updatedTime() })
					.where(eq(label.id, data.id))
					.execute();
			}

			return data.id;
		});
	},
	hardDeleteMany: async (db: DBType, data: IdSchemaType[]) => {
		const idList = data.map((currentData) => currentData.id);

		return await db.transaction(async (transDb) => {
			await transDb
				.delete(labelsToJournals)
				.where(inArray(labelsToJournals.labelId, idList))
				.execute();

			await transDb.delete(label).where(inArray(label.id, idList)).execute();
		});
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
	},
	seed: async (db: DBType, count: number) => {
		logging.info('Seeding Labels : ', count);

		const existingTitles = (
			await db.query.label.findMany({ columns: { title: true } }).execute()
		).map((item) => item.title);
		const itemsToCreate = createUniqueItemsOnly({
			existing: existingTitles,
			creationToString: (creation) => creation.title,
			createItem: createLabel,
			count
		});

		await labelActions.createMany(db, itemsToCreate);
	}
};
