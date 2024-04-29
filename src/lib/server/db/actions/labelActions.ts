import type {
	CreateLabelSchemaType,
	LabelFilterSchemaType,
	UpdateLabelSchemaType
} from '$lib/schema/labelSchema';
import { nanoid } from 'nanoid';
import type { DBType } from '../db';
import { label, labelsToJournals } from '../postgres/schema';
import { and, asc, desc, eq, max } from 'drizzle-orm';
import { statusUpdate } from './helpers/misc/statusUpdate';
import { updatedTime } from './helpers/misc/updatedTime';
import type { IdSchemaType } from '$lib/schema/idSchema';
import { logging } from '$lib/server/logging';
import { createLabel } from './helpers/seed/seedLabelData';
import { createUniqueItemsOnly } from './helpers/seed/createUniqueItemsOnly';
import { labelFilterToQuery } from './helpers/label/labelFilterToQuery';
import { labelCreateInsertionData } from './helpers/label/labelCreateInsertionData';
import { streamingDelay } from '$lib/server/testingDelay';
import { count as drizzleCount } from 'drizzle-orm';
import type { StatusEnumType } from '$lib/schema/statusSchema';
import { materializedViewActions } from './materializedViewActions';
import { labelMaterializedView } from '../postgres/schema/materializedViewSchema';
import { inArrayWrapped } from './helpers/misc/inArrayWrapped';
import { dbExecuteLogger } from '../dbLogger';
import { tLogger } from '../transactionLogger';

export const labelActions = {
	latestUpdate: async ({ db }: { db: DBType }) => {
		const latestUpdate = await dbExecuteLogger(
			db.select({ lastUpdated: max(label.updatedAt) }).from(label),
			'Labels - Latest Update'
		);
		return latestUpdate[0].lastUpdated || new Date();
	},
	getById: async (db: DBType, id: string) => {
		return dbExecuteLogger(
			db.query.label.findFirst({ where: eq(label.id, id) }),
			'Labels - Get By ID'
		);
	},
	count: async (db: DBType, filter?: LabelFilterSchemaType) => {
		materializedViewActions.conditionalRefresh({ db });
		const count = await dbExecuteLogger(
			db
				.select({ count: drizzleCount(labelMaterializedView.id) })
				.from(labelMaterializedView)
				.where(and(...(filter ? labelFilterToQuery(filter) : []))),
			'Labels - Count'
		);

		return count[0].count;
	},
	listWithTransactionCount: async (db: DBType) => {
		materializedViewActions.conditionalRefresh({ db });
		const items = dbExecuteLogger(
			db
				.select({ id: labelMaterializedView.id, journalCount: labelMaterializedView.count })
				.from(labelMaterializedView),
			'Labels - List With Transaction Count'
		);

		return items;
	},
	list: async ({ db, filter }: { db: DBType; filter: LabelFilterSchemaType }) => {
		materializedViewActions.conditionalRefresh({ db });
		const { page = 0, pageSize = 10, orderBy } = filter;

		const where = labelFilterToQuery(filter, true);

		const defaultOrderBy = [
			asc(labelMaterializedView.title),
			desc(labelMaterializedView.createdAt)
		];

		const orderByResult = orderBy
			? [
					...orderBy.map((currentOrder) =>
						currentOrder.direction === 'asc'
							? asc(labelMaterializedView[currentOrder.field])
							: desc(labelMaterializedView[currentOrder.field])
					),
					...defaultOrderBy
				]
			: defaultOrderBy;

		const results = await dbExecuteLogger(
			db
				.select()
				.from(labelMaterializedView)
				.where(and(...where))
				.limit(pageSize)
				.offset(page * pageSize)
				.orderBy(...orderByResult),
			'Labels - List - Results'
		);

		const resultCount = await dbExecuteLogger(
			db
				.select({ count: drizzleCount(labelMaterializedView.id) })
				.from(labelMaterializedView)
				.where(and(...where)),
			'Labels - List - Count'
		);

		const count = resultCount[0].count;
		const pageCount = Math.max(1, Math.ceil(count / pageSize));

		return { count, data: results, pageCount, page, pageSize };
	},
	listForDropdown: async ({ db }: { db: DBType }) => {
		await streamingDelay();
		const items = dbExecuteLogger(
			db.select({ id: label.id, title: label.title, enabled: label.allowUpdate }).from(label),
			'Labels - List For Dropdown'
		);

		return items;
	},
	createOrGet: async ({
		db,
		title,
		id,
		requireActive = true,
		cachedData
	}: {
		db: DBType;
		title?: string;
		id?: string;
		requireActive?: boolean;
		cachedData?: { id: string; title: string; status: StatusEnumType }[];
	}) => {
		if (id) {
			const currentLabel = cachedData
				? cachedData.find((currentData) => currentData.id === id)
				: await dbExecuteLogger(
						db.query.label.findFirst({ where: eq(label.id, id) }),
						'Labels - Create Or Get - Get By ID'
					);

			if (currentLabel) {
				if (requireActive && currentLabel.status !== 'active') {
					throw new Error(`Label ${currentLabel.title} is not active`);
				}
				return currentLabel.id;
			}
			throw new Error(`Label ${id} not found`);
		} else if (title) {
			const currentLabel = cachedData
				? cachedData.find((currentData) => currentData.title === title)
				: await dbExecuteLogger(
						db.query.label.findFirst({ where: eq(label.title, title) }),
						'Labels - Create Or Get - Get By Title'
					);
			if (currentLabel) {
				if (requireActive && currentLabel.status !== 'active') {
					throw new Error(`Label ${currentLabel.title} is not active`);
				}
				return currentLabel.id;
			}
			const newLabelId = await labelActions.create(db, {
				title,
				status: 'active'
			});
			const newLabel = await dbExecuteLogger(
				db.query.label.findFirst({ where: eq(label.id, newLabelId) }),
				'Labels - Create Or Get - Get New Label'
			);
			if (!newLabel) {
				throw new Error('Error Creating Label');
			}
			return newLabel.id;
		} else {
			throw new Error(`Label id or title required`);
		}
	},
	create: async (db: DBType, data: CreateLabelSchemaType) => {
		const id = nanoid();
		await dbExecuteLogger(
			db.insert(label).values(labelCreateInsertionData(data, id)),
			'Labels - Create'
		);

		await materializedViewActions.setRefreshRequired(db);

		return id;
	},
	createLink: async (
		db: DBType,
		{ journalId, labelId }: { journalId: string; labelId: string }
	) => {
		const id = nanoid();
		await dbExecuteLogger(
			db.insert(labelsToJournals).values({ id, journalId, labelId, ...updatedTime() }),
			'Labels - Create Link'
		);
		await materializedViewActions.setRefreshRequired(db);
	},
	createMany: async (db: DBType, data: CreateLabelSchemaType[]) => {
		const ids = data.map(() => nanoid());
		const insertData = data.map((currentData, index) =>
			labelCreateInsertionData(currentData, ids[index])
		);

		await dbExecuteLogger(db.insert(label).values(insertData), 'Labels - Create Many');
		await materializedViewActions.setRefreshRequired(db);

		return ids;
	},
	update: async (db: DBType, data: UpdateLabelSchemaType) => {
		const { id } = data;
		const currentLabel = await dbExecuteLogger(
			db.query.label.findFirst({ where: eq(label.id, id) }),
			'Labels - Update - Get By ID'
		);

		if (!currentLabel) {
			logging.error('Update Label: Label not found', data);
			return id;
		}

		await dbExecuteLogger(
			db
				.update(label)
				.set({
					...statusUpdate(data.status),
					...updatedTime(),
					title: data.title
				})
				.where(eq(label.id, id)),
			'Labels - Update'
		);
		await materializedViewActions.setRefreshRequired(db);

		return id;
	},
	canDeleteMany: async (db: DBType, ids: string[]) => {
		const canDeleteList = await Promise.all(
			ids.map(async (id) => labelActions.canDelete(db, { id }))
		);

		return canDeleteList.reduce((prev, current) => (current === false ? false : prev), true);
	},
	canDelete: async (db: DBType, data: IdSchemaType) => {
		const currentLabel = await dbExecuteLogger(
			db.query.label.findFirst({ where: eq(label.id, data.id), with: { journals: { limit: 1 } } }),
			'Labels - Can Delete - Get By ID'
		);
		if (!currentLabel) {
			return true;
		}

		//If the Label has no journals, then mark as deleted, otherwise do nothing
		return currentLabel && currentLabel.journals.length === 0;
	},
	softDelete: async (db: DBType, data: IdSchemaType) => {
		return tLogger(
			'Soft Delete Label',
			db.transaction(async (transDb) => {
				//If the Label has no journals, then mark as deleted, otherwise do nothing
				if (await labelActions.canDelete(db, data)) {
					await dbExecuteLogger(
						transDb.delete(labelsToJournals).where(eq(labelsToJournals.labelId, data.id)),
						'Labels - Soft Delete - Delete Links'
					);

					await dbExecuteLogger(
						transDb.delete(label).where(eq(label.id, data.id)),
						'Labels - Soft Delete'
					);
					await materializedViewActions.setRefreshRequired(db);
				}

				return data.id;
			})
		);
	},
	hardDeleteMany: async (db: DBType, data: IdSchemaType[]) => {
		if (data.length === 0) return;
		const idList = data.map((currentData) => currentData.id);

		return await tLogger(
			'Hard Delete Many Labels',
			db.transaction(async (transDb) => {
				await dbExecuteLogger(
					transDb.delete(labelsToJournals).where(inArrayWrapped(labelsToJournals.labelId, idList)),
					'Labels - Hard Delete Many - Delete Links'
				);

				await dbExecuteLogger(
					transDb.delete(label).where(inArrayWrapped(label.id, idList)),
					'Labels - Hard Delete Many'
				);
			})
		);
		await materializedViewActions.setRefreshRequired(db);
	},
	seed: async (db: DBType, count: number) => {
		logging.info('Seeding Labels : ', count);

		const existingTitles = (
			await dbExecuteLogger(
				db.query.label.findMany({ columns: { title: true } }),
				'Labels - Seed - Get Existing'
			)
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

export type LabelDropdownType = Awaited<ReturnType<typeof labelActions.listForDropdown>>;
