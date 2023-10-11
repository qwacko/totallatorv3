import {
	summaryCacheDataSchema,
	summaryCacheSchema,
	type SummaryCacheSchemaDataType
} from '$lib/schema/summaryCacheSchema';
import { eq } from 'drizzle-orm';
import type { DBType } from '../../db';
import { summaryCache } from '../../schema';

export const summaryCacheActions = {
	get: async ({ db, id }: { db: DBType; id: string }) => {
		const item = await db.query.summaryCache
			.findFirst({
				where: eq(summaryCache.id, id)
			})
			.execute();

		if (!item) {
			return undefined;
		}
		const parsedItem = summaryCacheSchema.safeParse(item);

		if (parsedItem.success) {
			return parsedItem.data;
		}

		await db.delete(summaryCache).where(eq(summaryCache.id, id)).execute();

		return undefined;
	},
	update: async ({
		db,
		id,
		data
	}: {
		db: DBType;
		id: string;
		data: SummaryCacheSchemaDataType;
	}) => {
		const parsedData = summaryCacheDataSchema.safeParse(data);
		if (parsedData.success) {
			const existing = await summaryCacheActions.get({ db, id });

			if (existing) {
				await db
					.update(summaryCache)
					.set({ data: parsedData.data })
					.where(eq(summaryCache.id, id))
					.execute();
			} else {
				await db.insert(summaryCache).values({ data: parsedData.data, id }).execute();
			}
		}
	},
	clear: async ({ db }: { db: DBType }) => {
		await db.delete(summaryCache).execute();
	},
	getOrUpdate: async ({
		db,
		id,
		generateData
	}: {
		db: DBType;
		id: string;
		generateData: (data: { db: DBType; id: string }) => Promise<SummaryCacheSchemaDataType>;
	}) => {
		const cachedSummary = await summaryCacheActions.get({ db, id });

		if (cachedSummary) {
			return cachedSummary.data;
		}
		const summary = await generateData({ db, id });

		const data = { id, ...summary };

		await summaryCacheActions.update({ id, db, data });
		return data;
	}
};
