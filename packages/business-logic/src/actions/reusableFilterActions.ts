import { and, asc, desc, eq, type InferSelectModel } from 'drizzle-orm';
import { count as drizzleCount } from 'drizzle-orm';
import { nanoid } from 'nanoid';

import { getContextDB, runInTransactionWithLogging } from '@totallator/context';
import { importTable, reusableFilter } from '@totallator/database';
import {
	createReusableFilterSchema,
	type CreateReusableFilterSchemaType,
	type ReusableFilterFilterSchemaType,
	updateReusableFilterSchema,
	type updateReusableFilterSchemaType
} from '@totallator/shared';
import { journalFilterSchema, updateJournalSchema } from '@totallator/shared';

import { getLogger } from '@/logger';
import { dbExecuteLogger } from '@/server/db/dbLogger';

import { filterNullUndefinedAndDuplicates } from '../helpers/filterNullUndefinedAndDuplicates';
import { streamingDelay, testingDelay } from '../server/testingDelay';
import { journalFilterToText } from './helpers/journal/journalFilterToQuery';
import { journalUpdateToText } from './helpers/journal/journalUpdateToText';
import { reusableFilterToQuery } from './helpers/journal/reusableFilterToQuery';
import { inArrayWrapped } from './helpers/misc/inArrayWrapped';
import { updatedTime } from './helpers/misc/updatedTime';
import { seedReusableFilterData } from './helpers/seed/seedReusableFilterData';
import { journalActions } from './journalActions';
import { journalMaterializedViewActions } from './journalMaterializedViewActions';

export const reusableFilterActions = {
	count: async () => {
		const db = getContextDB();
		const count = await dbExecuteLogger(
			db.select({ count: drizzleCount(reusableFilter.id) }).from(reusableFilter),
			'Reusable Filter - Count'
		);

		return count[0].count;
	},
	refreshFilterSummary: async ({ currentFilter }: { currentFilter: ReusableFilterTableType }) => {
		const db = getContextDB();
		const itemUnpacked = await reusableFilterDBUnpacked(currentFilter);

		const count = await journalMaterializedViewActions.count(itemUnpacked.filter);
		const canApply =
			count > 0 &&
			currentFilter.change !== null &&
			currentFilter.changeText !== null &&
			currentFilter.changeText.length > 0;

		if (count !== currentFilter.journalCount) {
			await dbExecuteLogger(
				db
					.update(reusableFilter)
					.set({ journalCount: count })
					.where(eq(reusableFilter.id, currentFilter.id)),
				'Reusable Filter - Update Journal Count'
			);
		}

		if (canApply !== currentFilter.canApply) {
			await dbExecuteLogger(
				db.update(reusableFilter).set({ canApply }).where(eq(reusableFilter.id, currentFilter.id)),
				'Reusable Filter - Update Can Apply'
			);
		}

		if (currentFilter.needsUpdate) {
			await dbExecuteLogger(
				db
					.update(reusableFilter)
					.set({ needsUpdate: false })
					.where(eq(reusableFilter.id, currentFilter.id)),
				'Reusable Filter - Update Needs Update'
			);
		}

		return { ...itemUnpacked, canApply, journalCount: count };
	},
	getById: async ({ id }: { id: string }) => {
		const db = getContextDB();
		const item = await dbExecuteLogger(
			db.select().from(reusableFilter).where(eq(reusableFilter.id, id)),
			'Reusable Filter - Get By ID'
		);
		if (!item || item.length === 0) {
			return undefined;
		}

		const updatedFilter = await reusableFilterActions.refreshFilterSummary({
			currentFilter: item[0]
		});

		return updatedFilter;
	},
	refreshAll: async ({ maximumTime }: { maximumTime: number }) => {
		const db = getContextDB();
		await dbExecuteLogger(
			db.update(reusableFilter).set({ needsUpdate: true }),
			'Reusable Filter - Refresh All'
		);
		return reusableFilterActions.refresh({ maximumTime });
	},
	refreshSome: async ({ ids }: { ids: string[] }) => {
		await Promise.all(ids.map((id) => reusableFilterActions.getById({ id })));
	},
	refresh: async ({ maximumTime }: { maximumTime: number }) => {
		const db = getContextDB();
		const startTime = Date.now();

		let numberModified = 0;

		while (Date.now() - startTime < maximumTime) {
			const filter = await dbExecuteLogger(
				db.select().from(reusableFilter).where(eq(reusableFilter.needsUpdate, true)).limit(1),
				'Reusable Filter - Refresh - Get Filter'
			);
			if (!filter || filter.length === 0) {
				break;
			}
			const currentFilter = filter[0];

			await reusableFilterActions.refreshFilterSummary({ currentFilter });

			numberModified++;
		}

		if (numberModified > -1) {
			const duration = Date.now() - startTime;
			getLogger('queries').debug({
				code: 'FILTER_001',
				title: `Updated ${numberModified} reusable filters, took ${duration}ms (limit = ${maximumTime}s))`,
				numberModified,
				duration,
				maximumTime
			});
		}

		return numberModified;
	},
	updateAndList: async ({
		filter,
		maximumTime
	}: {
		filter: ReusableFilterFilterSchemaType;
		maximumTime: number;
	}) => {
		await streamingDelay();

		await testingDelay();
		await reusableFilterActions.refresh({ maximumTime });
		return reusableFilterActions.list({ filter });
	},
	list: async ({ filter }: { filter: ReusableFilterFilterSchemaType }) => {
		const db = getContextDB();
		const { page = 0, pageSize = 10, orderBy, ...restFilter } = filter;

		const where = reusableFilterToQuery(restFilter);

		const defaultOrderBy = [
			asc(reusableFilter.group),
			asc(reusableFilter.title),
			desc(reusableFilter.createdAt)
		];

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

		const results = await dbExecuteLogger(
			db
				.select()
				.from(reusableFilter)
				.where(and(...where))
				.orderBy(...orderByResult)
				.limit(pageSize)
				.offset(page * pageSize),
			'Reusable Filter - List - Query'
		);

		const resultsProcessed = await reusableFilterDBUnpackedMany(results);

		const resultCount = await dbExecuteLogger(
			db
				.select({ count: drizzleCount(reusableFilter.id) })
				.from(reusableFilter)
				.where(and(...where)),
			'Reusable Filter - List - Count'
		);

		const count = resultCount[0].count;
		const pageCount = Math.max(1, Math.ceil(count / pageSize));

		return { count, data: resultsProcessed, pageCount, page, pageSize };
	},
	listForDropdown: async () => {
		const db = getContextDB();
		const allResults = await dbExecuteLogger(
			db
				.select()
				.from(reusableFilter)
				.orderBy(asc(reusableFilter.title), desc(reusableFilter.createdAt))
				.where(eq(reusableFilter.listed, true)),
			'Reusable Filter - List For Dropdown'
		);

		const results = (await reusableFilterDBUnpackedMany(allResults)).map((item) => ({
			title: item.title,
			group: item.group,
			filter: item.filter,
			change: item.change,
			modificationType: item.modificationType
		}));

		const groups = [
			...new Set(filterNullUndefinedAndDuplicates(results.map((item) => item.group)))
		];

		const groupedResults = groups.reduce<Record<string, (typeof results)[number][]>>(
			(acc, group) => {
				return {
					...acc,
					[group]: results
						.filter((item) => item.group === group)
						.sort((a, b) => a.title.localeCompare(b.title))
				};
			},
			{}
		);

		const resultsWithoutGroup = results
			.filter((item) => !item.group)
			.reduce<Record<string, (typeof results)[number][]>>((acc, curr) => {
				return {
					...acc,
					[curr.title]: [curr]
				};
			}, {});

		return {
			...groupedResults,
			...resultsWithoutGroup
		};
	},
	applyById: async ({ id, importId }: { id: string; importId?: string }) => {
		const item = await reusableFilterActions.getById({ id });

		if (!item) {
			return;
		}

		if (item.change) {
			await journalActions.updateJournals({
				filter: {
					...item.filter,
					importIdArray: importId
						? item.filter.importIdArray
							? [...item.filter.importIdArray, importId]
							: [importId]
						: undefined,
					page: 0,
					pageSize: 100000
				},
				journalData: item.change
			});
		}

		//This is called to refresh the filter summary after running the action, as the journal count should almost certainly change.
		await reusableFilterActions.getById({ id });

		return;
	},
	applyFollowingImport: async ({ importId, timeout }: { importId: string; timeout?: Date }) => {
		const db = getContextDB();
		const items = await dbExecuteLogger(
			db
				.select({ id: reusableFilter.id })
				.from(reusableFilter)
				.where(eq(reusableFilter.applyFollowingImport, true)),
			'Reusable Filter - Apply Following Import'
		);

		await dbExecuteLogger(
			db
				.update(importTable)
				.set({
					importStatus: {
						count: items.length,
						complete: 0,
						completeIds: [],
						ids: items.map((item) => item.id),
						startTime: new Date()
					},
					...updatedTime()
				})
				.where(eq(importTable.id, importId)),
			'Reusable Filter - Apply Following Import - Update Import Status'
		);

		let index = 1;

		let remainingNumber = items.length;

		while (remainingNumber > 0) {
			const currentItem = await dbExecuteLogger(
				db.query.importTable.findFirst({
					where: eq(importTable.id, importId)
				}),
				'Reusable Filter - Apply Following Import - Get Import'
			);

			if (!currentItem || !currentItem.importStatus) {
				throw new Error('Import Not Found');
			}

			const currentImportStatus = currentItem.importStatus;
			const currentImportId = currentItem.importStatus.ids[0];

			await runInTransactionWithLogging('Apply Following Import', async () => {
				await reusableFilterActions.applyById({
					id: currentImportId,
					importId
				});

				const ids = currentImportStatus.ids.filter((item) => item !== currentImportId);
				const completeIds = [...currentImportStatus.completeIds, currentImportId];
				remainingNumber = ids.length;

				const db = getContextDB();
				await dbExecuteLogger(
					db
						.update(importTable)
						.set({
							importStatus: {
								count: currentImportStatus.count,
								complete: completeIds.length,
								ids,
								completeIds,
								startTime: currentImportStatus.startTime
							},
							...updatedTime()
						})
						.where(eq(importTable.id, importId)),
					'Reusable Filter - Apply Following Import - Update Import Status'
				);
			});

			if (timeout && new Date() > timeout) {
				getLogger('queries').error({
					code: 'FILTER_002',
					title: `Filter Application Timeout. Reached ${index} of ${items.length} filters.`,
					index,
					totalFilters: items.length
				});
				throw new Error('Filter Application Timeout');
			}
		}

		// Clear The Import Status After Completion
		await dbExecuteLogger(
			db
				.update(importTable)
				.set({ importStatus: null, ...updatedTime() })
				.where(eq(importTable.id, importId)),
			'Reusable Filter - Apply Following Import - Clear Import Status'
		);
	},
	applyAllAutomatic: async () => {
		const db = getContextDB();
		const items = await dbExecuteLogger(
			db
				.select({ id: reusableFilter.id })
				.from(reusableFilter)
				.where(eq(reusableFilter.applyAutomatically, true)),
			'Reusable Filter - Apply All Automatic'
		);

		await Promise.all(
			items.map(async (currentItem) => {
				await reusableFilterActions.applyById({ id: currentItem.id });
			})
		);
	},
	createMany: async ({ data }: { data: CreateReusableFilterSchemaType[] }) => {
		const newFilters = await runInTransactionWithLogging(
			'Create Many Reusable Filters',
			async () => {
				return Promise.all(
					data.map(async (currentItem) => {
						return reusableFilterActions.create({ data: currentItem });
					})
				);
			}
		);

		return newFilters;
	},
	create: async ({ data }: { data: CreateReusableFilterSchemaType }) => {
		const db = getContextDB();
		const processedData = createReusableFilterSchema.safeParse(data);

		if (!processedData.success) {
			throw new Error('Invalid Data');
		}

		const { filter, title, change, group, modificationType, listed, ...reusableFilterData } =
			processedData.data;

		const idUse = nanoid();

		const filterText = await journalFilterToText({ db, filter });
		const titleUse = title || filterText.join(' and ');

		const changeText = await journalUpdateToText({ db, change });

		await dbExecuteLogger(
			db.insert(reusableFilter).values({
				filter: JSON.stringify(filter),
				filterText: filterText.join(' and '),
				change: change ? JSON.stringify(change) : undefined,
				changeText: changeText ? changeText.join(', ') : undefined,
				id: idUse,
				title: titleUse,
				group: group && group.length > 0 ? group : undefined,
				listed,
				modificationType: listed ? modificationType : undefined,
				...updatedTime(),
				...reusableFilterData
			}),
			'Reusable Filter - Create'
		);

		return reusableFilterActions.getById({ id: idUse });
	},
	update: async ({ id, data }: { id: string; data: updateReusableFilterSchemaType }) => {
		const db = getContextDB();
		const processedData = updateReusableFilterSchema.safeParse(data);

		if (!processedData.success) {
			throw new Error('Invalid Data');
		}

		const targetItem = await dbExecuteLogger(
			db.query.reusableFilter.findFirst({ where: eq(reusableFilter.id, id) }),
			'Reusable Filter - Update - Find'
		);

		if (!targetItem) {
			throw new Error('Item Not Found');
		}

		const { filter, change, group, modificationType, listed, ...reusableFilterData } =
			processedData.data;

		const filterText = filter ? await journalFilterToText({ db, filter }) : undefined;
		const filterTextUse = filterText ? filterText.join(' and ') : undefined;
		const changeText = await journalUpdateToText({ db, change });

		await dbExecuteLogger(
			db
				.update(reusableFilter)
				.set({
					filter: filter ? JSON.stringify(filter) : undefined,
					filterText: filterTextUse,
					change: change ? JSON.stringify(change) : undefined,
					changeText: changeText ? changeText.join(', ') : undefined,
					group: group && group.length > 0 ? group : null,
					listed,
					modificationType: listed ? modificationType : null,
					...updatedTime(),
					...reusableFilterData
				})
				.where(eq(reusableFilter.id, id)),
			'Reusable Filter - Update'
		);

		return reusableFilterActions.getById({ id });
	},
	delete: async ({ id }: { id: string }) => {
		const db = getContextDB();
		await dbExecuteLogger(
			db.delete(reusableFilter).where(eq(reusableFilter.id, id)),
			'Reusable Filter - Delete'
		);
	},
	deleteMany: async ({ ids }: { ids: string[] }) => {
		const db = getContextDB();
		if (ids.length > 0) {
			await dbExecuteLogger(
				db.delete(reusableFilter).where(inArrayWrapped(reusableFilter.id, ids)),
				'Reusable Filter - Delete Many'
			);
		}
	},
	seed: async ({ count }: { count: number }) => {
		const newFilters = Array(count)
			.fill(0)
			.map((_, index) => {
				return seedReusableFilterData({ id: index });
			});

		await reusableFilterActions.createMany({ data: newFilters });
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

export type ReusableFilterDropdownListType = Awaited<
	ReturnType<(typeof reusableFilterActions)['listForDropdown']>
>;
