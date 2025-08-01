import type {
	CreateLabelSchemaType,
	LabelFilterSchemaType,
	UpdateLabelSchemaType
} from '@totallator/shared';
import { nanoid } from 'nanoid';
import {
	label,
	labelsToJournals,
	type LabelTableType,
	type LabelViewReturnType
} from '@totallator/database';
import { and, asc, desc, eq, max } from 'drizzle-orm';
import { statusUpdate } from './helpers/misc/statusUpdate';
import { updatedTime } from './helpers/misc/updatedTime';
import type { IdSchemaType } from '@totallator/shared';
import { getLogger } from '@/logger';
import { createLabel } from './helpers/seed/seedLabelData';
import { createUniqueItemsOnly } from './helpers/seed/createUniqueItemsOnly';
import { labelFilterToQuery } from './helpers/label/labelFilterToQuery';
import { labelCreateInsertionData } from './helpers/label/labelCreateInsertionData';
import { streamingDelay } from '../server/testingDelay';
import { count as drizzleCount } from 'drizzle-orm';
import { materializedViewActions } from './materializedViewActions';
import { inArrayWrapped } from './helpers/misc/inArrayWrapped';
import { dbExecuteLogger } from '@/server/db/dbLogger';
import { tLogger } from '../server/db/transactionLogger';
import { getCorrectLabelTable } from './helpers/label/getCorrectLabelTable';
import type { ItemActionsType } from './helpers/misc/ItemActionsType';
import Papa from 'papaparse';
import { getContextDB } from '@totallator/context';

export type LabelDropdownType = {
	id: string;
	title: string;
	enabled: boolean;
}[];

type LabelActionsType = ItemActionsType<
	LabelTableType,
	LabelViewReturnType,
	LabelFilterSchemaType,
	CreateLabelSchemaType,
	UpdateLabelSchemaType,
	LabelDropdownType,
	number
>;

type HardDeleteManyFunction = (data: IdSchemaType[]) => Promise<void>;
type SoftDeleteFunction = (data: IdSchemaType) => Promise<string>;
type CreateLinkFunction = (data: { journalId: string; labelId: string }) => Promise<void>;

export const labelActions: Omit<LabelActionsType, 'delete' | 'deleteMany'> & {
	hardDeleteMany: HardDeleteManyFunction;
	softDelete: SoftDeleteFunction;
	createLink: CreateLinkFunction;
} = {
	latestUpdate: async () => {
		const db = getContextDB();
		const latestUpdate = await dbExecuteLogger(
			db.select({ lastUpdated: max(label.updatedAt) }).from(label),
			'Labels - Latest Update'
		);
		return latestUpdate[0].lastUpdated || new Date();
	},
	getById: async (id) => {
		const db = getContextDB();
		return dbExecuteLogger(
			db.query.label.findFirst({ where: eq(label.id, id) }),
			'Labels - Get By ID'
		);
	},
	count: async (filter) => {
		const db = getContextDB();
		const { table, target } = await getCorrectLabelTable();
		const count = await dbExecuteLogger(
			db
				.select({ count: drizzleCount(table.id) })
				.from(table)
				.where(and(...(filter ? labelFilterToQuery({ filter, target }) : []))),
			'Labels - Count'
		);

		return count[0].count;
	},
	listWithTransactionCount: async () => {
		const db = getContextDB();
		const { table } = await getCorrectLabelTable();
		const items = dbExecuteLogger(
			db.select({ id: table.id, journalCount: table.count }).from(table),
			'Labels - List With Transaction Count'
		);

		return items;
	},
	list: async ({ filter }: { filter: LabelFilterSchemaType }) => {
		const db = getContextDB();
		const { table, target } = await getCorrectLabelTable();
		const { page = 0, pageSize = 10, orderBy } = filter;

		const where = labelFilterToQuery({ filter, target });

		const defaultOrderBy = [asc(table.title), desc(table.createdAt)];

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
			'Labels - List - Results'
		);

		const resultCount = await dbExecuteLogger(
			db
				.select({ count: drizzleCount(table.id) })
				.from(table)
				.where(and(...where)),
			'Labels - List - Count'
		);

		const count = resultCount[0].count;
		const pageCount = Math.max(1, Math.ceil(count / pageSize));

		return { count, data: results, pageCount, page, pageSize };
	},
	generateCSVData: async ({ filter, returnType }) => {
		const data = await labelActions.list({
			filter: { ...filter, page: 0, pageSize: 100000 }
		});

		const preppedData = data.data.map((item, row) => {
			if (returnType === 'import') {
				return {
					title: item.title,
					status: item.status
				} satisfies CreateLabelSchemaType;
			}
			return {
				row,
				id: item.id,
				title: item.title,
				status: item.status,
				sum: item.sum,
				count: item.count
			};
		});

		const csvData = Papa.unparse(preppedData);

		return csvData;
	},
	listForDropdown: async () => {
		const db = getContextDB();
		await streamingDelay();
		const items = dbExecuteLogger(
			db.select({ id: label.id, title: label.title, enabled: label.allowUpdate }).from(label),
			'Labels - List For Dropdown'
		);

		return items;
	},
	createOrGet: async ({ title, id, requireActive = true, cachedData }) => {
		const db = getContextDB();
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
				return currentLabel;
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
				return currentLabel;
			}
			const newLabelId = await labelActions.create({
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
			return newLabel;
		} else {
			throw new Error(`Label id or title required`);
		}
	},
	create: async (data: CreateLabelSchemaType) => {
		const db = getContextDB();
		const id = nanoid();
		await dbExecuteLogger(
			db.insert(label).values(labelCreateInsertionData(data, id)),
			'Labels - Create'
		);

		await materializedViewActions.setRefreshRequired();

		return id;
	},
	createLink: async ({ journalId, labelId }: { journalId: string; labelId: string }) => {
		const db = getContextDB();
		const id = nanoid();
		await dbExecuteLogger(
			db.insert(labelsToJournals).values({ id, journalId, labelId, ...updatedTime() }),
			'Labels - Create Link'
		);
		await materializedViewActions.setRefreshRequired();
	},
	createMany: async (data: CreateLabelSchemaType[]) => {
		const db = getContextDB();
		const ids = data.map(() => nanoid());
		const insertData = data.map((currentData, index) =>
			labelCreateInsertionData(currentData, ids[index])
		);

		await dbExecuteLogger(db.insert(label).values(insertData), 'Labels - Create Many');
		await materializedViewActions.setRefreshRequired();

		return ids;
	},
	update: async ({ data, id }) => {
		const db = getContextDB();
		const currentLabel = await dbExecuteLogger(
			db.query.label.findFirst({ where: eq(label.id, id) }),
			'Labels - Update - Get By ID'
		);

		if (!currentLabel) {
			getLogger().error('Update Label: Label not found', data);
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
		await materializedViewActions.setRefreshRequired();

		return id;
	},
	canDeleteMany: async (ids: string[]) => {
		const canDeleteList = await Promise.all(ids.map(async (id) => labelActions.canDelete({ id })));

		return canDeleteList.reduce((prev, current) => (current === false ? false : prev), true);
	},
	canDelete: async (data: IdSchemaType) => {
		const db = getContextDB();
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
	softDelete: async (data: IdSchemaType) => {
		const db = getContextDB();
		return tLogger(
			'Soft Delete Label',
			db.transaction(async (transDb) => {
				//If the Label has no journals, then mark as deleted, otherwise do nothing
				if (await labelActions.canDelete(data)) {
					await dbExecuteLogger(
						transDb.delete(labelsToJournals).where(eq(labelsToJournals.labelId, data.id)),
						'Labels - Soft Delete - Delete Links'
					);

					await dbExecuteLogger(
						transDb.delete(label).where(eq(label.id, data.id)),
						'Labels - Soft Delete'
					);
					await materializedViewActions.setRefreshRequired();
				}

				return data.id;
			})
		);
	},
	hardDeleteMany: async (data: IdSchemaType[]) => {
		const db = getContextDB();
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
		await materializedViewActions.setRefreshRequired();
	},
	seed: async (count: number) => {
		const db = getContextDB();
		getLogger().info('Seeding Labels : ', count);

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

		await labelActions.createMany(itemsToCreate);
	}
};
