import type {
	CreateTagSchemaType,
	TagFilterSchemaType,
	UpdateTagSchemaType
} from '$lib/schema/tagSchema';
import { nanoid } from 'nanoid';
import type { DBType } from '../db';
import { account, journalEntry, summaryTable, tag } from '../schema';
import { and, asc, desc, eq, getTableColumns, inArray, sql } from 'drizzle-orm';
import { statusUpdate } from './helpers/misc/statusUpdate';
import { combinedTitleSplit } from '$lib/helpers/combinedTitleSplit';
import { updatedTime } from './helpers/misc/updatedTime';
import type { IdSchemaType } from '$lib/schema/idSchema';
import { logging } from '$lib/server/logging';
import { tagCreateInsertionData } from './helpers/tag/tagCreateInsertionData';
import { tagFilterToQuery } from './helpers/tag/tagFilterToQuery';
import { createTag } from './helpers/seed/seedTagData';
import { createUniqueItemsOnly } from './helpers/seed/createUniqueItemsOnly';
import { summaryActions, summaryTableColumnsToSelect } from './summaryActions';
import { summaryOrderBy } from './helpers/summary/summaryOrderBy';
import { streamingDelay } from '$lib/server/testingDelay';

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
			.leftJoin(journalEntry, eq(journalEntry.tagId, tag.id))
			.groupBy(tag.id)
			.execute();

		return items;
	},
	list: async ({ db, filter }: { db: DBType; filter: TagFilterSchemaType }) => {
		await summaryActions.updateAndCreateMany({
			db,
			ids: undefined,
			needsUpdateOnly: true,
			allowCreation: true
		});

		const { page = 0, pageSize = 10, orderBy, ...restFilter } = filter;

		const where = tagFilterToQuery(restFilter, true);

		const defaultOrderBy = [asc(tag.group), asc(tag.single), desc(tag.createdAt)];

		const orderByResult = orderBy
			? [
					...orderBy.map((currentOrder) =>
						summaryOrderBy(currentOrder, (remainingOrder) => {
							return remainingOrder.direction === 'asc'
								? asc(tag[remainingOrder.field])
								: desc(tag[remainingOrder.field]);
						})
					),
					...defaultOrderBy
			  ]
			: defaultOrderBy;

		const results = await db
			.select({
				...getTableColumns(tag),
				...summaryTableColumnsToSelect
			})
			.from(tag)
			.where(and(...where))
			.limit(pageSize)
			.offset(page * pageSize)
			.orderBy(...orderByResult)
			.leftJoin(journalEntry, eq(journalEntry.tagId, tag.id))
			.leftJoin(account, eq(account.id, journalEntry.accountId))
			.leftJoin(summaryTable, eq(summaryTable.relationId, tag.id))
			.groupBy(tag.id)
			.execute();

		const resultCount = await db
			.select({ count: sql<number>`count(${tag.id})`.mapWith(Number) })
			.from(tag)
			.where(and(...where))
			.execute();

		const count = resultCount[0].count;
		const pageCount = Math.max(1, Math.ceil(count / pageSize));

		return { count, data: results, pageCount, page, pageSize };
	},
	listForDropdown: async ({ db }: { db: DBType }) => {
		await streamingDelay();
		const items = db
			.select({ id: tag.id, title: tag.title, group: tag.group, enabled: tag.allowUpdate })
			.from(tag)
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
		await db.transaction(async (db) => {
			await db.insert(tag).values(tagCreateInsertionData(data, id)).execute();
			await summaryActions.createMissing({ db });
		});

		return id;
	},
	createMany: async (db: DBType, data: CreateTagSchemaType[]) => {
		const ids = data.map(() => nanoid());
		const insertData = data.map((currentData, index) =>
			tagCreateInsertionData(currentData, ids[index])
		);
		await db.transaction(async (db) => {
			await db.insert(tag).values(insertData).execute();
			await summaryActions.createMissing({ db });
		});

		return ids;
	},
	update: async (db: DBType, data: UpdateTagSchemaType) => {
		const { id } = data;
		const currentTag = await db.query.tag.findFirst({ where: eq(tag.id, id) }).execute();
		logging.info('Update Tag: ', data, currentTag);

		if (!currentTag) {
			logging.info('Update Tag: Tag not found');
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
	canDeleteMany: async (db: DBType, ids: string[]) => {
		const canDeleteList = await Promise.all(
			ids.map(async (id) => tagActions.canDelete(db, { id }))
		);

		return canDeleteList.reduce((prev, current) => (current === false ? false : prev), true);
	},
	canDelete: async (db: DBType, data: IdSchemaType) => {
		const currentTag = await db.query.tag
			.findFirst({ where: eq(tag.id, data.id), with: { journals: { limit: 1 } } })
			.execute();
		if (!currentTag) {
			return true;
		}

		// If the tag has no journals, then mark as deleted, otherwise do nothing
		return currentTag && currentTag.journals.length === 0;
	},
	delete: async (db: DBType, data: IdSchemaType) => {
		// If the tag has no journals, then mark as deleted, otherwise do nothing
		if (await tagActions.canDelete(db, data)) {
			await db.delete(tag).where(eq(tag.id, data.id)).execute();
		}

		return data.id;
	},
	deleteMany: async (db: DBType, data: IdSchemaType[]) => {
		if (data.length === 0) return;
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
