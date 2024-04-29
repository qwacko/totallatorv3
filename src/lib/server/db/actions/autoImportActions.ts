import {
	updateAutoImportSchema,
	type AutoImportFilterSchemaType,
	type CreateAutoImportSchemaType,
	type UpdateAutoImportFormSchemaType,
	type AutoImportFrequencyType
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
import { logging } from '$lib/server/logging';
import { dbExecuteLogger } from '../dbLogger';
import { tLogger } from '../transactionLogger';

export const autoImportActions = {
	list: async ({ db, filter }: { db: DBType; filter: AutoImportFilterSchemaType }) => {
		const { page = 0, pageSize = 10, orderBy, ...restFilter } = filter;

		const where = autoImportFilterToQuery({ filter: restFilter });

		const results = await dbExecuteLogger(
			db
				.select({
					...getTableColumns(autoImportTable),
					importMappingTitle: importMapping.title
				})
				.from(autoImportTable)
				.where(and(...where))
				.limit(pageSize)
				.leftJoin(importMapping, eq(autoImportTable.importMappingId, importMapping.id))
				.offset(page * pageSize)
				.orderBy(...autoImportToOrderByToSQL({ orderBy })),
			'Auto Import - List - Query'
		);

		const resultCount = await dbExecuteLogger(
			db
				.select({ count: drizzleCount(autoImportTable.id) })
				.from(autoImportTable)
				.where(and(...where)),
			'Auto Import - List - Count'
		);

		const count = resultCount[0].count;
		const pageCount = Math.max(1, Math.ceil(count / pageSize));

		return { count, data: results, pageCount, page, pageSize };
	},
	getById: async ({ db, id }: { db: DBType; id: string }) => {
		const autoImport = await dbExecuteLogger(
			db.select().from(autoImportTable).where(eq(autoImportTable.id, id)),
			'Auto Import - Get By Id'
		);

		if (autoImport.length === 0) {
			return null;
		}

		return autoImport[0];
	},
	clone: async ({ db, id }: { db: DBType; id: string }) => {
		const autoImport = await autoImportActions.getById({ db, id });

		if (!autoImport) {
			throw new Error(`AutoImport with id ${id} not found`);
		}

		const newId = nanoid();
		await dbExecuteLogger(
			db.insert(autoImportTable).values({
				...autoImport,
				id: newId,
				title: `${autoImport.title} (Copy)`,
				enabled: false,
				...updatedTime()
			}),
			'Auto Import - Clone'
		);

		return newId;
	},
	create: async ({ db, data }: { db: DBType; data: CreateAutoImportSchemaType }) => {
		const id = nanoid();
		await dbExecuteLogger(
			db.insert(autoImportTable).values({ id, ...data, ...updatedTime() }),
			'Auto Import - Create'
		);

		return id;
	},
	delete: async ({ db, id }: { db: DBType; id: string }) => {
		await tLogger(
			'Delete Auto Import',
			db.transaction(async (trx) => {
				await dbExecuteLogger(
					trx.delete(autoImportTable).where(eq(autoImportTable.id, id)),
					'Auto Import - Delete'
				);

				await dbExecuteLogger(
					trx
						.update(importTable)
						.set({ autoImportId: null })
						.where(eq(importTable.autoImportId, id)),
					'Auto Import - Delete - Update Import'
				);
			})
		);
	},
	update: async ({ db, data }: { db: DBType; data: UpdateAutoImportFormSchemaType }) => {
		const matchingAutoImport = await dbExecuteLogger(
			db.query.autoImportTable.findFirst({
				where: (autoImport, { eq }) => eq(autoImport.id, data.id)
			}),
			'Auto Import - Update - Find'
		);

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

		await dbExecuteLogger(
			db
				.update(autoImportTable)
				.set({
					...validatedUpdate.data,
					...updatedTime()
				})
				.where(eq(autoImportTable.id, id)),
			'Auto Import - Update'
		);
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
	},
	triggerMany: async ({ db, frequency }: { db: DBType; frequency: AutoImportFrequencyType }) => {
		const autoImports = await tActions.autoImport.list({
			db,
			filter: { frequency: [frequency], enabled: true, pageSize: 1000 }
		});
		for (const currentAutoImport of autoImports.data) {
			await tActions.autoImport.trigger({ db, id: currentAutoImport.id });
		}
	},
	trigger: async ({ db, id }: { db: DBType; id: string }) => {
		const autoImport = await autoImportActions.getById({ db, id });

		if (!autoImport) {
			throw new Error(`AutoImport with id ${id} not found`);
		}

		const data = await autoImportActions.getData({ db, id });

		logging.debug('Triggering Import', data.length, autoImport.title);

		const dateString = new Date().toISOString().slice(0, 10);

		const file = new File([JSON.stringify(data)], `${dateString}-${autoImport.title}.json`, {
			type: 'application/json'
		});

		await tActions.import.store({
			db,
			autoImportId: id,
			data: {
				autoClean: autoImport.autoClean,
				autoProcess: autoImport.autoProcess,
				checkImportedOnly: false,
				importType: 'mappedImport',
				importMappingId: autoImport.importMappingId,
				file
			}
		});
	}
};
