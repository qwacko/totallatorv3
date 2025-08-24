import { and, asc, desc, eq, max } from 'drizzle-orm';
import { count as drizzleCount } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import Papa from 'papaparse';

import { getContextDB, runInTransactionWithLogging } from '@totallator/context';
import {
	label,
	labelsToJournals,
	type LabelTableType,
	type LabelViewReturnType
} from '@totallator/database';
import type {
	CreateLabelSchemaType,
	LabelFilterSchemaType,
	UpdateLabelSchemaType
} from '@totallator/shared';
import type { IdSchemaType } from '@totallator/shared';

import { getLogger } from '@/logger';
import { dbExecuteLogger } from '@/server/db/dbLogger';

import { streamingDelay } from '../server/testingDelay';
import { getCorrectLabelTable } from './helpers/label/getCorrectLabelTable';
import { labelCreateInsertionData } from './helpers/label/labelCreateInsertionData';
import { labelFilterToQuery } from './helpers/label/labelFilterToQuery';
import { inArrayWrapped } from './helpers/misc/inArrayWrapped';
import type { ItemActionsType } from './helpers/misc/ItemActionsType';
import { statusUpdate } from './helpers/misc/statusUpdate';
import { updatedTime } from './helpers/misc/updatedTime';
import { createUniqueItemsOnly } from './helpers/seed/createUniqueItemsOnly';
import { createLabel } from './helpers/seed/seedLabelData';
import { materializedViewActions } from './materializedViewActions';

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

		getLogger('labels').debug({
			code: 'LABEL_010',
			title: 'Getting latest label update timestamp'
		});

		const latestUpdate = await dbExecuteLogger(
			db.select({ lastUpdated: max(label.updatedAt) }).from(label),
			'Labels - Latest Update'
		);

		const result = latestUpdate[0].lastUpdated || new Date();

		getLogger('labels').debug({
			code: 'LABEL_011',
			title: 'Latest label update timestamp retrieved',
			latestUpdate: result
		});

		return result;
	},
	getById: async (id) => {
		const db = getContextDB();

		getLogger('labels').debug({
			code: 'LABEL_020',
			title: 'Getting label by ID',
			labelId: id
		});

		const result = await dbExecuteLogger(
			db.query.label.findFirst({ where: eq(label.id, id) }),
			'Labels - Get By ID'
		);

		getLogger('labels').debug({
			code: 'LABEL_021',
			title: result ? 'Label found by ID' : 'Label not found by ID',
			labelId: id,
			found: !!result
		});

		return result;
	},
	count: async (filter) => {
		const db = getContextDB();
		const { table, target } = await getCorrectLabelTable();

		getLogger('labels').debug({
			code: 'LABEL_030',
			title: 'Counting labels with filter',
			filter
		});

		const count = await dbExecuteLogger(
			db
				.select({ count: drizzleCount(table.id) })
				.from(table)
				.where(and(...(filter ? labelFilterToQuery({ filter, target }) : []))),
			'Labels - Count'
		);

		getLogger('labels').debug({
			code: 'LABEL_031',
			title: 'Label count result',
			count: count[0].count,
			filter
		});

		return count[0].count;
	},
	listWithTransactionCount: async () => {
		const db = getContextDB();
		const { table } = await getCorrectLabelTable();

		getLogger('labels').debug({
			code: 'LABEL_040',
			title: 'Listing labels with transaction count'
		});

		const items = await dbExecuteLogger(
			db.select({ id: table.id, journalCount: table.count }).from(table),
			'Labels - List With Transaction Count'
		);

		getLogger('labels').debug({
			code: 'LABEL_041',
			title: 'Labels with transaction count retrieved',
			count: items.length
		});

		return items;
	},
	list: async ({ filter }: { filter: LabelFilterSchemaType }) => {
		const db = getContextDB();
		const { table, target } = await getCorrectLabelTable();
		const { page = 0, pageSize = 10, orderBy, ...restFilter } = filter;

		getLogger('labels').debug({
			code: 'LABEL_050',
			title: 'Listing labels with filter',
			filter: { page, pageSize, ...restFilter },
			hasOrderBy: !!orderBy
		});

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

		getLogger('labels').debug({
			code: 'LABEL_051',
			title: 'Label list results',
			totalCount: count,
			resultsReturned: results.length,
			pageCount,
			currentPage: page
		});

		return { count, data: results, pageCount, page, pageSize };
	},
	generateCSVData: async ({ filter, returnType }) => {
		getLogger('labels').info({
			code: 'LABEL_060',
			title: 'Generating CSV data for labels',
			returnType,
			filter
		});

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

		getLogger('labels').info({
			code: 'LABEL_061',
			title: 'CSV data generated successfully',
			returnType,
			recordCount: preppedData.length,
			csvLength: csvData.length
		});

		return csvData;
	},
	listForDropdown: async () => {
		const db = getContextDB();

		getLogger('labels').debug({
			code: 'LABEL_070',
			title: 'Listing labels for dropdown'
		});

		await streamingDelay();
		const items = await dbExecuteLogger(
			db
				.select({
					id: label.id,
					title: label.title,
					enabled: label.allowUpdate
				})
				.from(label),
			'Labels - List For Dropdown'
		);

		getLogger('labels').debug({
			code: 'LABEL_071',
			title: 'Dropdown labels retrieved',
			count: items.length
		});

		return items;
	},
	createOrGet: async ({ title, id, requireActive = true, cachedData }) => {
		const db = getContextDB();

		getLogger('labels').debug({
			code: 'LABEL_080',
			title: 'Creating or getting label',
			labelId: id,
			labelTitle: title,
			requireActive,
			usingCachedData: !!cachedData
		});

		if (id) {
			const currentLabel = cachedData
				? cachedData.find((currentData) => currentData.id === id)
				: await dbExecuteLogger(
						db.query.label.findFirst({ where: eq(label.id, id) }),
						'Labels - Create Or Get - Get By ID'
					);

			if (currentLabel) {
				if (requireActive && currentLabel.status !== 'active') {
					getLogger('labels').warn({
						code: 'LABEL_081',
						title: 'Label found but not active',
						labelId: id,
						labelTitle: currentLabel.title,
						status: currentLabel.status
					});
					throw new Error(`Label ${currentLabel.title} is not active`);
				}
				getLogger('labels').debug({
					code: 'LABEL_082',
					title: 'Found existing label by ID',
					labelId: id
				});
				return currentLabel;
			}
			getLogger('labels').error({
				code: 'LABEL_083',
				title: 'Label not found by ID',
				labelId: id
			});
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
					getLogger('labels').warn({
						code: 'LABEL_084',
						title: 'Label found by title but not active',
						labelTitle: title,
						status: currentLabel.status
					});
					throw new Error(`Label ${currentLabel.title} is not active`);
				}
				getLogger('labels').debug({
					code: 'LABEL_085',
					title: 'Found existing label by title',
					labelTitle: title
				});
				return currentLabel;
			}
			getLogger('labels').info({
				code: 'LABEL_086',
				title: 'Creating new label from title',
				labelTitle: title,
				status: 'active'
			});

			const newLabelId = await labelActions.create({
				title,
				status: 'active'
			});
			const newLabel = await dbExecuteLogger(
				db.query.label.findFirst({ where: eq(label.id, newLabelId) }),
				'Labels - Create Or Get - Get New Label'
			);
			if (!newLabel) {
				getLogger('labels').error({
					code: 'LABEL_087',
					title: 'Failed to create label from title',
					labelTitle: title
				});
				throw new Error('Error Creating Label');
			}
			getLogger('labels').info({
				code: 'LABEL_088',
				title: 'Successfully created label from title',
				labelId: newLabelId,
				labelTitle: title
			});
			return newLabel;
		} else {
			getLogger('labels').error({
				code: 'LABEL_089',
				title: 'Label id or title required for createOrGet'
			});
			throw new Error(`Label id or title required`);
		}
	},
	create: async (data: CreateLabelSchemaType) => {
		const db = getContextDB();
		const id = nanoid();
		const startTime = Date.now();

		getLogger('labels').info({
			code: 'LABEL_090',
			title: 'Creating new label',
			labelId: id,
			labelTitle: data.title,
			status: data.status
		});

		try {
			await dbExecuteLogger(
				db.insert(label).values(labelCreateInsertionData(data, id)),
				'Labels - Create'
			);

			await materializedViewActions.setRefreshRequired();

			const duration = Date.now() - startTime;
			getLogger('labels').info({
				code: 'LABEL_091',
				title: 'Label created successfully',
				labelId: id,
				labelTitle: data.title,
				duration
			});

			return id;
		} catch (e) {
			getLogger('labels').error({
				code: 'LABEL_092',
				title: 'Failed to create label',
				labelId: id,
				labelTitle: data.title,
				error: e
			});
			throw e;
		}
	},
	createLink: async ({ journalId, labelId }: { journalId: string; labelId: string }) => {
		const db = getContextDB();
		const id = nanoid();

		getLogger('labels').info({
			code: 'LABEL_100',
			title: 'Creating label-journal link',
			linkId: id,
			journalId,
			labelId
		});

		try {
			await dbExecuteLogger(
				db.insert(labelsToJournals).values({ id, journalId, labelId, ...updatedTime() }),
				'Labels - Create Link'
			);
			await materializedViewActions.setRefreshRequired();

			getLogger('labels').info({
				code: 'LABEL_101',
				title: 'Label-journal link created successfully',
				linkId: id,
				journalId,
				labelId
			});
		} catch (e) {
			getLogger('labels').error({
				code: 'LABEL_102',
				title: 'Failed to create label-journal link',
				linkId: id,
				journalId,
				labelId,
				error: e
			});
			throw e;
		}
	},
	createMany: async (data: CreateLabelSchemaType[]) => {
		const db = getContextDB();
		const startTime = Date.now();

		getLogger('labels').info({
			code: 'LABEL_110',
			title: 'Creating multiple labels',
			count: data.length
		});

		try {
			const ids = data.map(() => nanoid());
			const insertData = data.map((currentData, index) =>
				labelCreateInsertionData(currentData, ids[index])
			);

			await dbExecuteLogger(db.insert(label).values(insertData), 'Labels - Create Many');
			await materializedViewActions.setRefreshRequired();

			const duration = Date.now() - startTime;
			getLogger('labels').info({
				code: 'LABEL_111',
				title: 'Successfully created multiple labels',
				count: data.length,
				duration
			});

			return ids;
		} catch (e) {
			getLogger('labels').error({
				code: 'LABEL_112',
				title: 'Failed to create multiple labels',
				count: data.length,
				error: e
			});
			throw e;
		}
	},
	update: async ({ data, id }) => {
		const db = getContextDB();
		const startTime = Date.now();

		getLogger('labels').debug({
			code: 'LABEL_120',
			title: 'Starting label update',
			labelId: id,
			updateData: data
		});

		const currentLabel = await dbExecuteLogger(
			db.query.label.findFirst({ where: eq(label.id, id) }),
			'Labels - Update - Get By ID'
		);

		if (!currentLabel) {
			getLogger('labels').error({
				code: 'LABEL_121',
				title: 'Update Label: Label not found',
				labelId: id,
				updateData: data
			});
			return id;
		}

		try {
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

			const duration = Date.now() - startTime;
			getLogger('labels').info({
				code: 'LABEL_122',
				title: 'Label updated successfully',
				labelId: id,
				updateData: data,
				duration
			});

			return id;
		} catch (e) {
			getLogger('labels').error({
				code: 'LABEL_123',
				title: 'Failed to update label',
				labelId: id,
				updateData: data,
				error: e
			});
			throw e;
		}
	},
	canDeleteMany: async (ids: string[]) => {
		getLogger('labels').debug({
			code: 'LABEL_130',
			title: 'Checking if multiple labels can be deleted',
			labelIds: ids,
			count: ids.length
		});

		const canDeleteList = await Promise.all(ids.map(async (id) => labelActions.canDelete({ id })));

		const result = canDeleteList.reduce(
			(prev, current) => (current === false ? false : prev),
			true
		);

		getLogger('labels').debug({
			code: 'LABEL_131',
			title: 'Multiple label deletion check result',
			labelIds: ids,
			canDeleteAll: result,
			individualResults: canDeleteList
		});

		return result;
	},
	canDelete: async (data: IdSchemaType) => {
		const db = getContextDB();

		getLogger('labels').debug({
			code: 'LABEL_140',
			title: 'Checking if label can be deleted',
			labelId: data.id
		});

		const currentLabel = await dbExecuteLogger(
			db.query.label.findFirst({
				where: eq(label.id, data.id),
				with: { journals: { limit: 1 } }
			}),
			'Labels - Can Delete - Get By ID'
		);

		if (!currentLabel) {
			getLogger('labels').debug({
				code: 'LABEL_141',
				title: 'Label not found, can delete',
				labelId: data.id
			});
			return true;
		}

		//If the Label has no journals, then mark as deleted, otherwise do nothing
		const canDelete = currentLabel && currentLabel.journals.length === 0;

		getLogger('labels').debug({
			code: 'LABEL_142',
			title: 'Label deletion check result',
			labelId: data.id,
			labelTitle: currentLabel.title,
			canDelete,
			journalCount: currentLabel.journals.length
		});

		return canDelete;
	},
	softDelete: async (data: IdSchemaType) => {
		getLogger('labels').info({
			code: 'LABEL_150',
			title: 'Starting soft delete of label',
			labelId: data.id
		});

		return runInTransactionWithLogging('Soft Delete Label', async () => {
			//If the Label has no journals, then mark as deleted, otherwise do nothing
			const canDelete = await labelActions.canDelete(data);

			if (canDelete) {
				const db = getContextDB();

				getLogger('labels').info({
					code: 'LABEL_151',
					title: 'Proceeding with label deletion',
					labelId: data.id
				});

				await dbExecuteLogger(
					db.delete(labelsToJournals).where(eq(labelsToJournals.labelId, data.id)),
					'Labels - Soft Delete - Delete Links'
				);

				await dbExecuteLogger(
					db.delete(label).where(eq(label.id, data.id)),
					'Labels - Soft Delete'
				);
				await materializedViewActions.setRefreshRequired();

				getLogger('labels').info({
					code: 'LABEL_152',
					title: 'Label soft deleted successfully',
					labelId: data.id
				});
			} else {
				getLogger('labels').warn({
					code: 'LABEL_153',
					title: 'Label cannot be deleted due to existing journal links',
					labelId: data.id
				});
			}

			return data.id;
		});
	},
	hardDeleteMany: async (data: IdSchemaType[]) => {
		if (data.length === 0) {
			getLogger('labels').debug({
				code: 'LABEL_160',
				title: 'Hard delete many labels called with empty array'
			});
			return;
		}

		const idList = data.map((currentData) => currentData.id);

		getLogger('labels').info({
			code: 'LABEL_161',
			title: 'Starting hard delete of multiple labels',
			labelIds: idList,
			count: data.length
		});

		return await runInTransactionWithLogging('Hard Delete Many Labels', async () => {
			try {
				const db = getContextDB();
				await dbExecuteLogger(
					db.delete(labelsToJournals).where(inArrayWrapped(labelsToJournals.labelId, idList)),
					'Labels - Hard Delete Many - Delete Links'
				);

				await dbExecuteLogger(
					db.delete(label).where(inArrayWrapped(label.id, idList)),
					'Labels - Hard Delete Many'
				);

				await materializedViewActions.setRefreshRequired();

				getLogger('labels').info({
					code: 'LABEL_162',
					title: 'Hard deleted multiple labels successfully',
					labelIds: idList,
					count: data.length
				});
			} catch (e) {
				getLogger('labels').error({
					code: 'LABEL_163',
					title: 'Failed to hard delete multiple labels',
					labelIds: idList,
					count: data.length,
					error: e
				});
				throw e;
			}
		});
	},
	seed: async (count: number) => {
		const db = getContextDB();
		const startTime = Date.now();

		getLogger('labels').info({
			code: 'LABEL_002',
			title: 'Seeding Labels',
			count
		});

		try {
			const existingTitles = (
				await dbExecuteLogger(
					db.query.label.findMany({ columns: { title: true } }),
					'Labels - Seed - Get Existing'
				)
			).map((item) => item.title);

			getLogger('labels').debug({
				code: 'LABEL_170',
				title: 'Found existing labels for seeding',
				existingCount: existingTitles.length
			});

			const itemsToCreate = createUniqueItemsOnly({
				existing: existingTitles,
				creationToString: (creation) => creation.title,
				createItem: createLabel,
				count
			});

			getLogger('labels').info({
				code: 'LABEL_171',
				title: 'Creating unique labels for seeding',
				requestedCount: count,
				uniqueToCreate: itemsToCreate.length
			});

			await labelActions.createMany(itemsToCreate);

			const duration = Date.now() - startTime;
			getLogger('labels').info({
				code: 'LABEL_172',
				title: 'Label seeding completed successfully',
				requestedCount: count,
				createdCount: itemsToCreate.length,
				duration
			});
		} catch (e) {
			getLogger('labels').error({
				code: 'LABEL_173',
				title: 'Failed to seed labels',
				requestedCount: count,
				error: e
			});
			throw e;
		}
	}
};
