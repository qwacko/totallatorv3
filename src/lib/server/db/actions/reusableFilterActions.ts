import {
	createReusableFilterSchema,
	updateReusableFilterSchema,
	type CreateReusableFilterSchemaType,
	type ReusableFilterFilterSchemaType,
	type updateReusableFilterSchemaType
} from '$lib/schema/reusableFilterSchema';
import { and, asc, desc, eq, sql, type InferSelectModel, inArray } from 'drizzle-orm';
import type { DBType } from '../db';
import { reusableFilter } from '$lib/server/db/postgres/schema';
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
import { count as drizzleCount } from 'drizzle-orm'

export const reusableFilterActions = {
	refreshFilterSummary: async ({
		db,
		currentFilter
	}: {
		db: DBType;
		currentFilter: ReusableFilterTableType;
	}) => {
		const itemUnpacked = await reusableFilterDBUnpacked(currentFilter);

		const count = await tActions.journal.count(db, itemUnpacked.filter);
		const canApply =
			count > 0 &&
			currentFilter.change !== null &&
			currentFilter.changeText !== null &&
			currentFilter.changeText.length > 0;

		if (count !== currentFilter.journalCount) {
			await db
				.update(reusableFilter)
				.set({ journalCount: count })
				.where(eq(reusableFilter.id, currentFilter.id))
				.execute();
		}

		if (canApply !== currentFilter.canApply) {
			await db
				.update(reusableFilter)
				.set({ canApply })
				.where(eq(reusableFilter.id, currentFilter.id))
				.execute();
		}

		if (currentFilter.needsUpdate) {
			await db
				.update(reusableFilter)
				.set({ needsUpdate: false })
				.where(eq(reusableFilter.id, currentFilter.id))
				.execute();
		}

		return { ...itemUnpacked, canApply, journalCount: count };
	},
	getById: async ({ db, id }: { db: DBType; id: string }) => {
		const item = await db.select().from(reusableFilter).where(eq(reusableFilter.id, id)).execute();
		if (!item || item.length === 0) {
			return undefined;
		}

		const updatedFilter = await reusableFilterActions.refreshFilterSummary({
			db,
			currentFilter: item[0]
		});

		return updatedFilter;
	},
	refresh: async ({ db, maximumTime }: { db: DBType; maximumTime: number }) => {
		const startTime = Date.now();

		let numberModified = 0;

		while (Date.now() - startTime < maximumTime) {
			const filter = await db
				.select()
				.from(reusableFilter)
				.where(eq(reusableFilter.needsUpdate, true))
				.limit(1)
				.execute();
			if (!filter || filter.length === 0) {
				break;
			}
			const currentFilter = filter[0];

			await reusableFilterActions.refreshFilterSummary({ db, currentFilter });
			numberModified++;
		}

		if (numberModified > 0) {
			logging.info(
				`Updated ${numberModified} reusable filters, took ${Date.now() - startTime
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

		const results = await db
			.select()
			.from(reusableFilter)
			.where(and(...where))
			.orderBy(...orderByResult)
			.limit(pageSize)
			.offset(page * pageSize)
			.execute();

		const resultsProcessed = await reusableFilterDBUnpackedMany(results);

		const resultCount = await db
			.select({ count: drizzleCount(reusableFilter.id) })
			.from(reusableFilter)
			.where(and(...where))
			.execute();

		const count = resultCount[0].count;
		const pageCount = Math.max(1, Math.ceil(count / pageSize));

		return { count, data: resultsProcessed, pageCount, page, pageSize };
	},
	listForDropdown: async ({ db }: { db: DBType }) => {
		const allResults = await db
			.select()
			.from(reusableFilter)
			.orderBy(asc(reusableFilter.title), desc(reusableFilter.createdAt))
			.where(eq(reusableFilter.listed, true))
			.execute();

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

		return;
	},
	applyFollowingImport: async ({ db, importId }: { db: DBType; importId: string }) => {
		const items = await db
			.select({ id: reusableFilter.id })
			.from(reusableFilter)
			.where(eq(reusableFilter.applyFollowingImport, true))
			.execute();

		await Promise.all(
			items.map(async (currentItem) => {
				await reusableFilterActions.applyById({ db, id: currentItem.id, importId });
			})
		);
	},
	applyAllAutomatic: async ({ db }: { db: DBType }) => {
		const items = await db
			.select({ id: reusableFilter.id })
			.from(reusableFilter)
			.where(eq(reusableFilter.applyAutomatically, true))
			.execute();

		await Promise.all(
			items.map(async (currentItem) => {
				await reusableFilterActions.applyById({ db, id: currentItem.id });
			})
		);
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

		await db
			.insert(reusableFilter)
			.values({
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
			})
			.execute();

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

		const targetItem = await db.query.reusableFilter
			.findFirst({ where: eq(reusableFilter.id, id) })
			.execute();

		if (!targetItem) {
			throw new Error('Item Not Found');
		}

		const { filter, change, group, modificationType, listed, ...reusableFilterData } =
			processedData.data;

		const filterText = filter ? await journalFilterToText({ db, filter }) : undefined;
		const filterTextUse = filterText ? filterText.join(' and ') : undefined;
		const changeText = await journalUpdateToText({ db, change });

		await db
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
			.where(eq(reusableFilter.id, id))
			.execute();

		return reusableFilterActions.getById({ db, id });
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

export type ReusableFilterDropdownListType = Awaited<
	ReturnType<(typeof reusableFilterActions)['listForDropdown']>
>;
