import {
	createReusableFilterSchema,
	updateReusableFilterSchema,
	type CreateReusableFilterSchemaType,
	type ReusableFilterFilterSchemaType,
	type updateReusableFilterSchemaType
} from '$lib/schema/reusableFilterSchema';
import { and, asc, desc, eq, sql, type InferSelectModel, inArray } from 'drizzle-orm';
import type { DBType } from '../db';
import { reusableFilter } from '$lib/server/db/schema';
import { reusableFilterToQuery } from './helpers/reusableFilterToQuery';
import { nanoid } from 'nanoid';
import { journalFilterToText } from './helpers/journalFilterToQuery';
import { updatedTime } from './helpers/updatedTime';
import { journalUpdateToText } from './helpers/journalUpdateToText';
import { journalFilterSchema, updateJournalSchema } from '$lib/schema/journalSchema';

export const reusableFilterActions = {
	getById: async ({ db, id }: { db: DBType; id: string }) => {
		const item = await db.select().from(reusableFilter).where(eq(reusableFilter.id, id)).execute();
		if (!item || item.length === 0) {
			return undefined;
		}
		return reusableFilterDBUnpacked(item[0]);
	},
	list: async ({ db, filter }: { db: DBType; filter: ReusableFilterFilterSchemaType }) => {
		const { page = 0, pageSize = 10, orderBy, ...restFilter } = filter;

		const where = reusableFilterToQuery(restFilter);

		const defaultOrderBy = [asc(reusableFilter.title), desc(reusableFilter.createdAt)];

		const orderByResult = orderBy
			? [
					...orderBy.map((currentOrder) => {
						return currentOrder.direction === 'asc'
							? asc(reusableFilter[currentOrder.field])
							: desc(reusableFilter[currentOrder.field]);
					}),
					...defaultOrderBy
			  ]
			: defaultOrderBy;

		const results = await db
			.select()
			.from(reusableFilter)
			.where(and(...where))
			.orderBy(...orderByResult)
			.limit(pageSize)
			.offset(page * pageSize)
			.execute();

		const resultCount = await db
			.select({ count: sql<number>`count(${reusableFilter.id})`.mapWith(Number) })
			.from(reusableFilter)
			.where(and(...where))
			.execute();

		const count = resultCount[0].count;
		const pageCount = Math.max(1, Math.ceil(count / pageSize));

		return { count, data: await reusableFilterDBUnpackedMany(results), pageCount, page, pageSize };
	},
	create: async ({ db, data }: { db: DBType; data: CreateReusableFilterSchemaType }) => {
		const processedData = createReusableFilterSchema.safeParse(data);

		if (!processedData.success) {
			throw new Error('Invalid Data');
		}

		const { filter, title, change, ...reusableFilterData } = processedData.data;

		const idUse = nanoid();

		const filterText = await journalFilterToText(filter);
		const titleUse = title || filterText.join(' and ');

		const changeText = await journalUpdateToText(change);

		await db
			.insert(reusableFilter)
			.values({
				filter: JSON.stringify(filter),
				filterText: filterText.join(' and '),
				change: change ? JSON.stringify(change) : undefined,
				changeText: changeText ? changeText.join(', ') : undefined,
				id: idUse,
				title: titleUse,
				...updatedTime(),
				...reusableFilterData
			})
			.execute();
	},
	update: async ({
		db,
		id,
		data
	}: {
		db: DBType;
		id: string;
		data: updateReusableFilterSchemaType;
	}) => {
		const processedData = updateReusableFilterSchema.safeParse(data);

		if (!processedData.success) {
			throw new Error('Invalid Data');
		}

		const targetItem = await db.query.reusableFilter
			.findFirst({ where: eq(reusableFilter.id, id) })
			.execute();

		if (!targetItem) {
			throw new Error('Item Not Found');
		}

		const { filter, title, change, useFilterTextForTitle, ...reusableFilterData } =
			processedData.data;

		const filterText = filter ? await journalFilterToText(filter) : undefined;
		const filterTextUse = filterText ? filterText.join(' and ') : undefined;
		const titleUse = title ? title : useFilterTextForTitle ? filterTextUse : undefined;
		const changeText = await journalUpdateToText(change);

		await db
			.update(reusableFilter)
			.set({
				filter: filter ? JSON.stringify(filter) : undefined,
				filterText: filterTextUse,
				change: change ? JSON.stringify(change) : undefined,
				changeText: changeText ? changeText.join(', ') : undefined,
				title: titleUse,
				...updatedTime(),
				...reusableFilterData
			})
			.where(eq(reusableFilter.id, id))
			.execute();
	},
	delete: async ({ db, id }: { db: DBType; id: string }) => {
		await db.delete(reusableFilter).where(eq(reusableFilter.id, id)).execute();
	},
	deleteMany: async ({ db, ids }: { db: DBType; ids: string[] }) => {
		if (ids.length > 0) {
			await db.delete(reusableFilter).where(inArray(reusableFilter.id, ids)).execute();
		}
	}
};

type ReusableFilterTableType = InferSelectModel<typeof reusableFilter>;

const reusableFilterDBUnpacked = async (item: ReusableFilterTableType | undefined) => {
	if (!item) throw new Error('Item Not Found');
	const { change, filter, ...unmodifiedColumns } = item;

	const changeUse = change ? updateJournalSchema.parse(JSON.parse(change)) : undefined;

	const filterUse = journalFilterSchema.parse(JSON.parse(filter));

	return {
		filter: filterUse,
		change: changeUse,
		...unmodifiedColumns
	};
};
const reusableFilterDBUnpackedMany = async (items: ReusableFilterTableType[]) => {
	return Promise.all(items.map(async (item) => reusableFilterDBUnpacked(item)));
};
