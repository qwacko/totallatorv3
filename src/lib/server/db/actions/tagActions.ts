import type {
	CreateTagSchemaType,
	TagFilterSchemaType,
	UpdateTagSchemaType
} from '$lib/schema/tagSchema';
import { nanoid } from 'nanoid';
import type { DBType } from '../db';
import { journalEntry, tag } from '../schema';
import { and, asc, desc, eq, inArray, sql } from 'drizzle-orm';
import { statusUpdate } from './helpers/statusUpdate';
import { combinedTitleSplit } from '$lib/helpers/combinedTitleSplit';
import { updatedTime } from './helpers/updatedTime';
import type { IdSchemaType } from '$lib/schema/idSchema';
import { logging } from '$lib/server/logging';
import { tagCreateInsertionData } from './helpers/tagCreateInsertionData';
import { tagFilterToQuery } from './helpers/tagFilterToQuery';
import { createTag } from './helpers/seedTagData';
import { createUniqueItemsOnly } from './helpers/createUniqueItemsOnly';

export const tagActions = {
	getById: async (db: DBType, id: string) => {
		return db.query.tag.findFirst({ where: eq(tag.id, id) }).execute();
	},
	count: async (db: DBType, filter?: TagFilterSchemaType) => {
		const where = filter ? tagFilterToQuery(filter) : [];

		const result = await db
			.select({ count: sql<number>`count(${tag.id})`.mapWith(Number) })
			.from(tag)
			.where(and(...where))
			.execute();

		return result[0].count;
	},
	listWithTransactionCount: async (db: DBType) => {
		const items = db
			.select({ id: tag.id, journalCount: sql<number>`count(${journalEntry.id})` })
			.from(tag)
			.leftJoin(journalEntry, eq(journalEntry.accountId, tag.id))
			.groupBy(tag.id)
			.execute();

		return items;
	},
	list: async (db: DBType, filter: TagFilterSchemaType) => {
		const { page = 0, pageSize = 10, orderBy, ...restFilter } = filter;

		const where = tagFilterToQuery(restFilter);

		const defaultOrderBy = [asc(tag.group), asc(tag.single), desc(tag.createdAt)];

		const orderByResult = orderBy
			? [
					...orderBy.map((currentOrder) =>
						currentOrder.direction === 'asc'
							? asc(tag[currentOrder.field])
							: desc(tag[currentOrder.field])
					),
					...defaultOrderBy
			  ]
			: defaultOrderBy;

		const results = db.query.tag
			.findMany({
				where: and(...where),
				offset: page * pageSize,
				limit: pageSize,
				orderBy: orderByResult
			})
			.execute();

		const resultCount = await db
			.select({ count: sql<number>`count(${tag.id})`.mapWith(Number) })
			.from(tag)
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
			const currentTag = await db.query.tag.findFirst({ where: eq(tag.id, id) }).execute();

			if (currentTag) {
				if (requireActive && currentTag.status !== 'active') {
					throw new Error(`Tag ${currentTag.title} is not active`);
				}
				return currentTag;
			}
			throw new Error(`Tag ${id} not found`);
		} else if (title) {
			const currentTag = await db.query.tag.findFirst({ where: eq(tag.title, title) }).execute();
			if (currentTag) {
				if (requireActive && currentTag.status !== 'active') {
					throw new Error(`Tag ${currentTag.title} is not active`);
				}
				return currentTag;
			}
			const newTagId = await tagActions.create(db, {
				title,
				status: 'active'
			});
			const newTag = await db.query.tag.findFirst({ where: eq(tag.id, newTagId) }).execute();
			if (!newTag) {
				throw new Error('Error Creating Tag');
			}
			return newTag;
		} else {
			return undefined;
		}
	},
	create: async (db: DBType, data: CreateTagSchemaType) => {
		const id = nanoid();
		await db.insert(tag).values(tagCreateInsertionData(data, id)).execute();

		return id;
	},
	createMany: async (db: DBType, data: CreateTagSchemaType[]) => {
		const ids = data.map(() => nanoid());
		const insertData = data.map((currentData, index) =>
			tagCreateInsertionData(currentData, ids[index])
		);

		await db.insert(tag).values(insertData).execute();

		return ids;
	},
	update: async (db: DBType, data: UpdateTagSchemaType) => {
		const { id } = data;
		const currentTag = await db.query.tag.findFirst({ where: eq(tag.id, id) }).execute();
		logging.info('Update Tag: ', data, currentTag);

		if (!currentTag || currentTag.status === 'deleted') {
			logging.info('Update Tag: Tag not found or deleted');
			return id;
		}

		if (data.status && data.status === 'deleted') {
			logging.info('Update Tag: Cannot Use Update To Set To Deleted');
			return id;
		}

		await db
			.update(tag)
			.set({
				...statusUpdate(data.status),
				...updatedTime(),
				...combinedTitleSplit(data)
			})
			.where(eq(tag.id, id))
			.execute();

		return id;
	},
	delete: async (db: DBType, data: IdSchemaType) => {
		const currentTag = await db.query.tag
			.findFirst({ where: eq(tag.id, data.id), with: { journals: { limit: 1 } } })
			.execute();

		// If the tag has no journals, then mark as deleted, otherwise do nothing
		if (currentTag && currentTag.journals.length === 0) {
			await db
				.update(tag)
				.set({ ...statusUpdate('deleted'), ...updatedTime() })
				.where(eq(tag.id, data.id))
				.execute();
		}

		return data.id;
	},
	deleteMany: async (db: DBType, data: IdSchemaType[]) => {
		const currentTags = await tagActions.listWithTransactionCount(db);
		const itemsForDeletion = data.filter((item) => {
			const currentTag = currentTags.find((current) => current.id === item.id);
			return currentTag && currentTag.journalCount === 0;
		});
		if (itemsForDeletion.length === data.length) {
			await db
				.delete(tag)
				.where(
					inArray(
						tag.id,
						itemsForDeletion.map((item) => item.id)
					)
				)
				.execute();
			return true;
		}
		return false;
	},
	undelete: async (db: DBType, data: IdSchemaType) => {
		const currentTag = await db.query.tag.findFirst({ where: eq(tag.id, data.id) }).execute();
		if (currentTag && currentTag.deleted) {
			await db
				.update(tag)
				.set({ ...statusUpdate('active'), ...updatedTime() })
				.where(eq(tag.id, data.id))
				.execute();
		}
	},
	seed: async (db: DBType, count: number) => {
		logging.info('Seeding Tags : ', count);

		const existingTitles = (
			await db.query.tag.findMany({ columns: { title: true } }).execute()
		).map((item) => item.title);
		const itemsToCreate = createUniqueItemsOnly({
			existing: existingTitles,
			creationToString: (creation) => creation.title,
			createItem: createTag,
			count
		});

		await tagActions.createMany(db, itemsToCreate);
	}
};
