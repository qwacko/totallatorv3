import {
	createReusableFilterSchema,
	updateReusableFilterSchema,
	type CreateReusableFilterSchemaType,
	type ReusableFilterFilterSchemaType,
	type updateReusableFilterSchemaType
} from '$lib/schema/reusableFilterSchema';
import { and, asc, desc, eq, type InferSelectModel } from 'drizzle-orm';
import type { DBType } from '../db';
import { importTable, reusableFilter } from '$lib/server/db/postgres/schema';
import { reusableFilterToQuery } from './helpers/journal/reusableFilterToQuery';
import { nanoid } from 'nanoid';
import { journalFilterToText } from './helpers/journal/journalFilterToQuery';
import { updatedTime } from './helpers/misc/updatedTime';
import { journalUpdateToText } from './helpers/journal/journalUpdateToText';
import { journalFilterSchema, updateJournalSchema } from '$lib/schema/journalSchema';
import { filterNullUndefinedAndDuplicates } from '$lib/helpers/filterNullUndefinedAndDuplicates';
import { tActions } from './tActions';
import { streamingDelay, testingDelay } from '$lib/server/testingDelay';
import { logging } from '$lib/server/logging';
import { count as drizzleCount } from 'drizzle-orm';
import { seedReusableFilterData } from './helpers/seed/seedReusableFilterData';
import { inArrayWrapped } from './helpers/misc/inArrayWrapped';
import { dbExecuteLogger } from '../dbLogger';
import { tLogger } from '../transactionLogger';

export const reusableFilterActions = {
	count: async (db: DBType) => {
		const count = await dbExecuteLogger(
			db.select({ count: drizzleCount(reusableFilter.id) }).from(reusableFilter),
			'Reusable Filter - Count'
		);

		return count[0].count;
	},
	refreshFilterSummary: async ({
		db,
		currentFilter
	}: {
		db: DBType;
		currentFilter: ReusableFilterTableType;
	}) => {
		const itemUnpacked = await reusableFilterDBUnpacked(currentFilter);

		const count = await tActions.journalView.count(db, itemUnpacked.filter);
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
	getById: async ({ db, id }: { db: DBType; id: string }) => {
		const item = await dbExecuteLogger(
			db.select().from(reusableFilter).where(eq(reusableFilter.id, id)),
			'Reusable Filter - Get By ID'
		);
		if (!item || item.length === 0) {
			return undefined;
		}

		const updatedFilter = await reusableFilterActions.refreshFilterSummary({
			db,
			currentFilter: item[0]
		});

		return updatedFilter;
	},
	refreshAll: async ({ db, maximumTime }: { db: DBType; maximumTime: number }) => {
		await dbExecuteLogger(
			db.update(reusableFilter).set({ needsUpdate: true }),
			'Reusable Filter - Refresh All'
		);
		return reusableFilterActions.refresh({ db, maximumTime });
	},
	refreshSome: async ({ db, ids }: { db: DBType; ids: string[] }) => {
		await Promise.all(ids.map((id) => reusableFilterActions.getById({ db, id })));
	},
	refresh: async ({ db, maximumTime }: { db: DBType; maximumTime: number }) => {
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

			await reusableFilterActions.refreshFilterSummary({ db, currentFilter });

			numberModified++;
		}

		if (numberModified > -1) {
			logging.debug(
				`Updated ${numberModified} reusable filters, took ${
					Date.now() - startTime
				}ms (limit = ${maximumTime}s))`
			);
		}

		return numberModified;
	},
	updateAndList: async ({
		db,
		filter,
		maximumTime
	}: {
		db: DBType;
		filter: ReusableFilterFilterSchemaType;
		maximumTime: number;
	}) => {
		await streamingDelay();

		await testingDelay();
		await reusableFilterActions.refresh({ db, maximumTime });
		return reusableFilterActions.list({ db, filter });
	},
	list: async ({ db, filter }: { db: DBType; filter: ReusableFilterFilterSchemaType }) => {
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
	listForDropdown: async ({ db }: { db: DBType }) => {
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
	applyById: async ({ db, id, importId }: { db: DBType; id: string; importId?: string }) => {
		const item = await reusableFilterActions.getById({ db, id });

		if (!item) {
			return;
		}

		if (item.change) {
			await tActions.journal.updateJournals({
				db,
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
		await reusableFilterActions.getById({ db, id });

		return;
	},
	applyFollowingImport: async ({
		db,
		importId,
		timeout
	}: {
		db: DBType;
		importId: string;
		timeout?: Date;
	}) => {
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

			await tLogger(
				'Apply Following Import',
				db.transaction(async (db) => {
					await reusableFilterActions.applyById({
						db,
						id: currentImportId,
						importId
					});

					const ids = currentImportStatus.ids.filter((item) => item !== currentImportId);
					const completeIds = [...currentImportStatus.completeIds, currentImportId];
					remainingNumber = ids.length;

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
				})
			);

			if (timeout && new Date() > timeout) {
				logging.error(`Filter Application Timeout. Reached ${index} of ${items.length} filters.`);
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
	applyAllAutomatic: async ({ db }: { db: DBType }) => {
		const items = await dbExecuteLogger(
			db
				.select({ id: reusableFilter.id })
				.from(reusableFilter)
				.where(eq(reusableFilter.applyAutomatically, true)),
			'Reusable Filter - Apply All Automatic'
		);

		await Promise.all(
			items.map(async (currentItem) => {
				await reusableFilterActions.applyById({ db, id: currentItem.id });
			})
		);
	},
	createMany: async ({ db, data }: { db: DBType; data: CreateReusableFilterSchemaType[] }) => {
		const newFilters = await tLogger(
			'Create Many Reusable Filters',
			db.transaction(async (db) => {
				return Promise.all(
					data.map(async (currentItem) => {
						return reusableFilterActions.create({ db, data: currentItem });
					})
				);
			})
		);

		return newFilters;
	},
	create: async ({ db, data }: { db: DBType; data: CreateReusableFilterSchemaType }) => {
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

		return reusableFilterActions.getById({ db, id: idUse });
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

		return reusableFilterActions.getById({ db, id });
	},
	delete: async ({ db, id }: { db: DBType; id: string }) => {
		await dbExecuteLogger(
			db.delete(reusableFilter).where(eq(reusableFilter.id, id)),
			'Reusable Filter - Delete'
		);
	},
	deleteMany: async ({ db, ids }: { db: DBType; ids: string[] }) => {
		if (ids.length > 0) {
			await dbExecuteLogger(
				db.delete(reusableFilter).where(inArrayWrapped(reusableFilter.id, ids)),
				'Reusable Filter - Delete Many'
			);
		}
	},
	seed: async ({ db, count }: { db: DBType; count: number }) => {
		const newFilters = Array(count)
			.fill(0)
			.map((_, index) => {
				return seedReusableFilterData({ db, id: index });
			});

		await reusableFilterActions.createMany({ db, data: newFilters });
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
