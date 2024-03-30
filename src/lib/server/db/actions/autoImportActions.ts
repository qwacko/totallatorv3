import {
	updateAutoImportSchema,
	type AutoImportFilterSchemaType,
	type CreateAutoImportSchemaType,
	type UpdateAutoImportFormSchemaType
} from '$lib/schema/autoImportSchema';
import { nanoid } from 'nanoid';
import type { DBType } from '../db';
import { autoImportTable, importMapping, importTable } from '../postgres/schema';
import { updatedTime } from './helpers/misc/updatedTime';
import { eq, and, getTableColumns, count as drizzleCount } from 'drizzle-orm';
import { autoImportFilterToQuery } from './helpers/autoImport/autoImportFilterToQuery';
import { autoImportToOrderByToSQL } from './helpers/autoImport/autoImportOrderByToSQL';
import { getData_Common } from './helpers/autoImport/getData_Common';
import { tActions } from './tActions';

export const autoImportActions = {
	list: async ({ db, filter }: { db: DBType; filter: AutoImportFilterSchemaType }) => {
		const { page = 0, pageSize = 10, orderBy, ...restFilter } = filter;

		const where = autoImportFilterToQuery({ filter: restFilter });

		const results = await db
			.select({
				...getTableColumns(autoImportTable),
				importMappingTitle: importMapping.title
			})
			.from(autoImportTable)
			.where(and(...where))
			.limit(pageSize)
			.leftJoin(importMapping, eq(autoImportTable.importMappingId, importMapping.id))
			.offset(page * pageSize)
			.orderBy(...autoImportToOrderByToSQL({ orderBy }))
			.execute();

		const resultCount = await db
			.select({ count: drizzleCount(autoImportTable.id) })
			.from(autoImportTable)
			.where(and(...where))
			.execute();

		const count = resultCount[0].count;
		const pageCount = Math.max(1, Math.ceil(count / pageSize));

		return { count, data: results, pageCount, page, pageSize };
	},
	getById: async ({ db, id }: { db: DBType; id: string }) => {
		const autoImport = await db
			.select()
			.from(autoImportTable)
			.where(eq(autoImportTable.id, id))
			.execute();

		if (autoImport.length === 0) {
			return null;
		}

		return autoImport[0];
	},
	create: async ({ db, data }: { db: DBType; data: CreateAutoImportSchemaType }) => {
		const id = nanoid();
		await db
			.insert(autoImportTable)
			.values({ id, ...data, ...updatedTime() })
			.execute();

		return id;
	},
	delete: async ({ db, id }: { db: DBType; id: string }) => {
		await db.transaction(async (trx) => {
			await trx.delete(autoImportTable).where(eq(autoImportTable.id, id)).execute();

			await trx
				.update(importTable)
				.set({ autoImportId: null })
				.where(eq(importTable.autoImportId, id))
				.execute();
		});
	},
	update: async ({ db, data }: { db: DBType; data: UpdateAutoImportFormSchemaType }) => {
		const matchingAutoImport = await db.query.autoImportTable.findFirst({
			where: (autoImport, { eq }) => eq(autoImport.id, data.id)
		});

		if (!matchingAutoImport) {
			throw new Error(`AutoImport with id ${data.id} not found`);
		}

		const {
			id,
			title,
			enabled,
			importMappingId,
			frequency,
			type,
			autoProcess,
			autoClean,
			...config
		} = data;

		const newData = {
			title: title ?? matchingAutoImport.title,
			enabled: enabled === undefined ? matchingAutoImport.enabled : enabled,
			importMappingId: importMappingId ?? matchingAutoImport.importMappingId,
			frequency: frequency ?? matchingAutoImport.frequency,
			type: type ?? matchingAutoImport.type,
			autoProcess: autoProcess ?? matchingAutoImport.autoProcess,
			autoClean: autoClean ?? matchingAutoImport.autoClean,
			config: {
				...matchingAutoImport.config,
				...config
			}
		};

		const validatedUpdate = updateAutoImportSchema.safeParse(newData);

		if (!validatedUpdate.success) {
			throw new Error(`Invalid update data: ${validatedUpdate.error.message}`);
		}

		await db
			.update(autoImportTable)
			.set({
				...validatedUpdate.data,
				...updatedTime()
			})
			.where(eq(autoImportTable.id, id))
			.execute();
	},
	getData: async ({ db, id }: { db: DBType; id: string }) => {
		const autoImport = await autoImportActions.getById({ db, id });

		if (!autoImport) {
			throw new Error(`AutoImport with id ${id} not found`);
		}

		return getData_Common({ config: autoImport.config });
	},
	updateSampleData: async ({ db, id }: { db: DBType; id: string }) => {
		const autoImport = await autoImportActions.getById({ db, id });

		if (!autoImport) {
			throw new Error(`AutoImport with id ${id} not found`);
		}

		const data = await autoImportActions.getData({ db, id });

		if (data.length > 0) {
			await tActions.importMapping.update({
				db,
				id: autoImport.importMappingId,
				data: { sampleData: JSON.stringify(data.slice(0, 5)) }
			});
		}
	}
};
