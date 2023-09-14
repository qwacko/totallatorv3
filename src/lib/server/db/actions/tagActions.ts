import type {
	CreateTagSchemaType,
	TagFilterSchemaType,
	UpdateTagSchemaType
} from '$lib/schema/tagSchema';
import { nanoid } from 'nanoid';
import type { DBType } from '../db';
import { tag } from '../schema';
import { SQL, and, asc, desc, eq, ilike, sql } from 'drizzle-orm';
import { statusUpdate } from './helpers/statusUpdate';
import { combinedTitle } from './helpers/combinedTitle';
import { updatedTime } from './helpers/updatedTime';
import type { IdSchemaType } from '$lib/schema/idSchema';

export const tagActions = {
	list: async (db: DBType, filter: TagFilterSchemaType) => {
		const { page, pageSize, orderBy, ...restFilter } = filter;

		const where: SQL<unknown>[] = [];
		if (restFilter.id) where.push(eq(tag.id, restFilter.id));
		if (restFilter.title) where.push(ilike(tag.title, `%${restFilter.title}%`));
		if (restFilter.group) where.push(ilike(tag.title, `%${restFilter.group}%`));
		if (restFilter.single) where.push(ilike(tag.title, `%${restFilter.single}%`));
		if (restFilter.status) where.push(eq(tag.status, restFilter.status));
		if (restFilter.deleted) where.push(eq(tag.deleted, restFilter.deleted));
		if (restFilter.disabled) where.push(eq(tag.disabled, restFilter.disabled));
		if (restFilter.allowUpdate) where.push(eq(tag.allowUpdate, restFilter.allowUpdate));
		if (restFilter.active) where.push(eq(tag.active, restFilter.active));

		const orderByResult = orderBy.map((currentOrder) =>
			currentOrder.direction === 'asc'
				? asc(tag[currentOrder.field])
				: desc(tag[currentOrder.field])
		);

		const results = db.query.tag.findMany({
			where: and(...where),
			offset: page * pageSize,
			limit: pageSize,
			orderBy: orderByResult
		});

		const resultCount = await db
			.select({ count: sql<number>`count(${tag.id})`.mapWith(Number) })
			.from(tag)
			.where(and(...where))
			.execute();

		const count = resultCount[0].count;
		const pageCount = Math.ceil(count / pageSize);

		return { count, data: await results, pageCount, page, pageSize };
	},
	create: async (db: DBType, data: CreateTagSchemaType) => {
		const id = nanoid();
		await db
			.insert(tag)
			.values({
				id,
				...statusUpdate(data.status),
				...updatedTime(),
				...combinedTitle(data)
			})
			.execute();

		return id;
	},
	update: async (db: DBType, data: UpdateTagSchemaType) => {
		const { id } = data;
		const currentTag = await db.query.tag.findFirst({ where: eq(tag.id, id) }).execute();

		//Only update if the tag is disabled or active (signalled by "allowUpdate")
		if (currentTag && currentTag.allowUpdate) {
			await db
				.update(tag)
				.set({
					...statusUpdate(data.status),
					...updatedTime(),
					...combinedTitle(data)
				})
				.where(eq(tag.id, id))
				.execute();
		}
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
	undelete: async (db: DBType, data: IdSchemaType) => {
		const currentTag = await db.query.tag.findFirst({ where: eq(tag.id, data.id) }).execute();
		if (currentTag && currentTag.deleted) {
			await db
				.update(tag)
				.set({ ...statusUpdate('active'), ...updatedTime() })
				.where(eq(tag.id, data.id))
				.execute();
		}
	}
};
