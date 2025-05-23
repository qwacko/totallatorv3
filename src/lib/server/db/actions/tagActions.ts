import type {
	CreateTagSchemaType,
	TagFilterSchemaType,
	UpdateTagSchemaType
} from '$lib/schema/tagSchema';
import { nanoid } from 'nanoid';
import { journalEntry, tag, type TagTableType, type TagViewReturnType } from '../postgres/schema';
import { and, asc, count, desc, eq, max } from 'drizzle-orm';
import { statusUpdate } from './helpers/misc/statusUpdate';
import { combinedTitleSplit } from '$lib/helpers/combinedTitleSplit';
import { updatedTime } from './helpers/misc/updatedTime';
import { logging } from '$lib/server/logging';
import { tagCreateInsertionData } from './helpers/tag/tagCreateInsertionData';
import { tagFilterToQuery } from './helpers/tag/tagFilterToQuery';
import { createTag } from './helpers/seed/seedTagData';
import { createUniqueItemsOnly } from './helpers/seed/createUniqueItemsOnly';
import { streamingDelay } from '$lib/server/testingDelay';
import { count as drizzleCount } from 'drizzle-orm';
import { materializedViewActions } from './materializedViewActions';
import { inArrayWrapped } from './helpers/misc/inArrayWrapped';
import { dbExecuteLogger } from '../dbLogger';
import { getCorrectTagTable } from './helpers/tag/getCorrectTagTable';
import type { ItemActionsType } from './helpers/misc/ItemActionsType';
import Papa from 'papaparse';

export type TagDropdownType = {
	id: string;
	title: string;
	group: string;
	enabled: boolean;
}[];

type TagActionsType = ItemActionsType<
	TagTableType,
	TagViewReturnType,
	TagFilterSchemaType,
	CreateTagSchemaType,
	UpdateTagSchemaType,
	TagDropdownType,
	number
>;

export const tagActions: TagActionsType = {
	latestUpdate: async ({ db }) => {
		const latestUpdate = await dbExecuteLogger(
			db.select({ lastUpdated: max(tag.updatedAt) }).from(tag),
			'Tags - Latest Update'
		);
		return latestUpdate[0].lastUpdated || new Date();
	},
	getById: async (db, id) => {
		return dbExecuteLogger(db.query.tag.findFirst({ where: eq(tag.id, id) }), 'Tags - Get By Id');
	},
	count: async (db, filter) => {
		const { table, target } = await getCorrectTagTable(db);
		const where = filter ? tagFilterToQuery({ filter, target }) : [];

		const result = await dbExecuteLogger(
			db
				.select({ count: drizzleCount(table.id) })
				.from(table)
				.where(and(...where)),
			'Tags - Count'
		);

		return result[0].count;
	},
	listWithTransactionCount: async (db) => {
		const items = dbExecuteLogger(
			db
				.select({ id: tag.id, journalCount: count(journalEntry.id) })
				.from(tag)
				.leftJoin(journalEntry, eq(journalEntry.tagId, tag.id))
				.groupBy(tag.id),
			'Tags - List With Transaction Count'
		);

		return items;
	},
	list: async ({ db, filter }) => {
		const { table, target } = await getCorrectTagTable(db);

		const { page = 0, pageSize = 10, orderBy, ...restFilter } = filter;

		const where = tagFilterToQuery({ filter: restFilter, target });

		const defaultOrderBy = [asc(table.group), asc(table.single), desc(table.createdAt)];

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
			'Tags - List - Results'
		);

		const resultCount = await dbExecuteLogger(
			db
				.select({ count: drizzleCount(table.id) })
				.from(table)
				.where(and(...where)),
			'Tags - List - Count'
		);

		const count = resultCount[0].count;
		const pageCount = Math.max(1, Math.ceil(count / pageSize));

		return { count, data: results, pageCount, page, pageSize };
	},
	generateCSVData: async ({ db, filter, returnType }) => {
		const data = await tagActions.list({
			db,
			filter: { ...filter, page: 0, pageSize: 100000 }
		});

		const preppedData = data.data.map((item, row) => {
			if (returnType === 'import') {
				return {
					title: item.title,
					status: item.status
				} satisfies CreateTagSchemaType;
			}
			return {
				row,
				id: item.id,
				title: item.title,
				group: item.group,
				single: item.single,
				status: item.status,
				sum: item.sum,
				count: item.count
			};
		});

		const csvData = Papa.unparse(preppedData);

		return csvData;
	},
	listForDropdown: async ({ db }) => {
		await streamingDelay();
		const items = dbExecuteLogger(
			db
				.select({ id: tag.id, title: tag.title, group: tag.group, enabled: tag.allowUpdate })
				.from(tag),
			'Tags - List For Dropdown'
		);

		return items;
	},
	createOrGet: async ({ db, title, id, requireActive = true, cachedData }) => {
		if (id) {
			const currentTag = cachedData
				? cachedData.find((current) => current.id === id)
				: await dbExecuteLogger(
						db.query.tag.findFirst({ where: eq(tag.id, id) }),
						'Tags - Create Or Get - By Id'
					);

			if (currentTag) {
				if (requireActive && currentTag.status !== 'active') {
					throw new Error(`Tag ${currentTag.title} is not active`);
				}
				return currentTag;
			}
			throw new Error(`Tag ${id} not found`);
		} else if (title) {
			const currentTag = cachedData
				? cachedData.find((current) => current.title === title)
				: await dbExecuteLogger(
						db.query.tag.findFirst({ where: eq(tag.title, title) }),
						'Tags - Create Or Get - Title'
					);
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

			const newTag = await dbExecuteLogger(
				db.query.tag.findFirst({ where: eq(tag.id, newTagId) }),
				'Tags - Create Or Get - New Tag'
			);
			if (!newTag) {
				throw new Error('Error Creating Tag');
			}
			return newTag;
		} else {
			return undefined;
		}
	},
	create: async (db, data) => {
		const id = nanoid();
		await dbExecuteLogger(db.insert(tag).values(tagCreateInsertionData(data, id)), 'Tags - Create');

		await materializedViewActions.setRefreshRequired(db);
		return id;
	},
	createMany: async (db, data) => {
		const ids = data.map(() => nanoid());
		const insertData = data.map((currentData, index) =>
			tagCreateInsertionData(currentData, ids[index])
		);
		await dbExecuteLogger(db.insert(tag).values(insertData), 'Tags - Create Many');

		await materializedViewActions.setRefreshRequired(db);
		return ids;
	},
	update: async ({ db, data, id }) => {
		const currentTag = await dbExecuteLogger(
			db.query.tag.findFirst({ where: eq(tag.id, id) }),
			'Tags - Update - Current Tag'
		);

		if (!currentTag) {
			logging.error('Update Tag: Tag not found', data);
			return id;
		}

		await dbExecuteLogger(
			db
				.update(tag)
				.set({
					...statusUpdate(data.status),
					...updatedTime(),
					...combinedTitleSplit(data)
				})
				.where(eq(tag.id, id)),
			'Tags - Update'
		);

		await materializedViewActions.setRefreshRequired(db);
		return id;
	},
	canDeleteMany: async (db, ids) => {
		const canDeleteList = await Promise.all(
			ids.map(async (id) => tagActions.canDelete(db, { id }))
		);

		return canDeleteList.reduce((prev, current) => (current === false ? false : prev), true);
	},
	canDelete: async (db, data) => {
		const currentTag = await dbExecuteLogger(
			db.query.tag.findFirst({ where: eq(tag.id, data.id), with: { journals: { limit: 1 } } }),
			'Tags - Can Delete'
		);
		if (!currentTag) {
			return true;
		}

		// If the tag has no journals, then mark as deleted, otherwise do nothing
		return currentTag && currentTag.journals.length === 0;
	},
	delete: async (db, data) => {
		// If the tag has no journals, then mark as deleted, otherwise do nothing
		if (await tagActions.canDelete(db, data)) {
			await dbExecuteLogger(db.delete(tag).where(eq(tag.id, data.id)), 'Tags - Delete');
		}

		await materializedViewActions.setRefreshRequired(db);
		return data.id;
	},
	deleteMany: async (db, data) => {
		if (data.length === 0) return;
		const currentTags = await tagActions.listWithTransactionCount(db);
		const itemsForDeletion = data.filter((item) => {
			const currentTag = currentTags.find((current) => current.id === item.id);
			return currentTag && currentTag.journalCount === 0;
		});
		if (itemsForDeletion.length === data.length) {
			await dbExecuteLogger(
				db.delete(tag).where(
					inArrayWrapped(
						tag.id,
						itemsForDeletion.map((item) => item.id)
					)
				),
				'Tags - Delete Many'
			);
			await materializedViewActions.setRefreshRequired(db);
			return true;
		}
		return false;
	},
	seed: async (db, count) => {
		logging.info('Seeding Tags : ', count);

		const existingTitles = (
			await dbExecuteLogger(
				db.query.tag.findMany({ columns: { title: true } }),
				'Tags - Seed - Existing'
			)
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
