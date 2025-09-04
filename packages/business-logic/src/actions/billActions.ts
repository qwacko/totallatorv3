import { and, asc, count, desc, eq, isNotNull, max } from 'drizzle-orm';
import { count as drizzleCount } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import Papa from 'papaparse';

import { getContextDB } from '@totallator/context';
import {
	bill,
	type BillTableType,
	type BillViewReturnType,
	journalEntry
} from '@totallator/database';
import type {
	BillFilterSchemaType,
	CreateBillSchemaType,
	UpdateBillSchemaType
} from '@totallator/shared';

import { getLogger } from '@/logger';
import { dbExecuteLogger } from '@/server/db/dbLogger';

import { streamingDelay, testingDelay } from '../server/testingDelay';
import { accountGetById } from './helpers/account/accountGetById';
import { billCreateInsertionData } from './helpers/bill/billCreateInsertionData';
import { billFilterToQuery } from './helpers/bill/billFilterToQuery';
import { getCorrectBillTable } from './helpers/bill/getCorrectBillTable';
import { inArrayWrapped } from './helpers/misc/inArrayWrapped';
import type { ItemActionsType } from './helpers/misc/ItemActionsType';
import { statusUpdate } from './helpers/misc/statusUpdate';
import { updatedTime } from './helpers/misc/updatedTime';
import { createUniqueItemsOnly } from './helpers/seed/createUniqueItemsOnly';
import { createBill } from './helpers/seed/seedBillData';
import { materializedViewActions } from './materializedViewActions';

export type BillDropdownType = {
	id: string;
	title: string;
	enabled: boolean;
}[];

type BillActionsType = ItemActionsType<
	BillTableType,
	BillViewReturnType,
	BillFilterSchemaType,
	CreateBillSchemaType,
	UpdateBillSchemaType,
	BillDropdownType,
	number
>;

export const billActions: BillActionsType = {
	latestUpdate: async () => {
		const db = getContextDB();
		const latestUpdate = await dbExecuteLogger(
			db.select({ lastUpdated: max(bill.updatedAt) }).from(bill),
			'Bill - Latest Update'
		);
		return latestUpdate[0].lastUpdated || new Date();
	},
	getById: async (id) => {
		const db = getContextDB();
		return dbExecuteLogger(db.query.bill.findFirst({ where: eq(bill.id, id) }), 'Bill - Get By Id');
	},
	count: async (filter) => {
		const db = getContextDB();
		const { table, target } = await getCorrectBillTable();
		const count = await dbExecuteLogger(
			db
				.select({ count: drizzleCount(table.id) })
				.from(table)
				.where(and(...(filter ? billFilterToQuery({ filter, target }) : []))),
			'Bill - Count'
		);

		return count[0].count;
	},
	listWithTransactionCount: async () => {
		const db = getContextDB();
		const { table } = await getCorrectBillTable();
		const items = dbExecuteLogger(
			db.select({ id: table.id, journalCount: table.count }).from(table),
			'Bill - List With Transaction Count'
		);

		return items;
	},
	list: async ({ filter }) => {
		const db = getContextDB();
		const { table, target } = await getCorrectBillTable();
		const { page = 0, pageSize = 10, orderBy, ...restFilter } = filter;

		const where = billFilterToQuery({ filter: restFilter, target });

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
			'Bill - List - Results'
		);

		const resultCount = await dbExecuteLogger(
			db
				.select({ count: drizzleCount(table.id) })
				.from(table)
				.where(and(...where)),
			'Bill - List - Count'
		);

		const count = resultCount[0].count;
		const pageCount = Math.max(1, Math.ceil(count / pageSize));

		return { count, data: results, pageCount, page, pageSize };
	},
	listRecommendationsFromPayee: async ({ payeeId }) => {
		const account = await accountGetById(payeeId);
		if (!account || account.isCatchall) {
			return [];
		}

		const db = getContextDB();

		const innerSelect = db
			.select({ id: journalEntry.billId })
			.from(journalEntry)
			.where(and(eq(journalEntry.accountId, payeeId), isNotNull(journalEntry.billId)))
			.limit(100)
			.as('inner_table');
		const recommendations = await dbExecuteLogger(
			db
				.select({ id: innerSelect.id, title: bill.title, count: count(innerSelect.id) })
				.from(innerSelect)
				.leftJoin(bill, eq(bill.id, innerSelect.id))
				.groupBy(innerSelect.id, bill.title)
				.orderBy((self) => desc(self.count))
				.limit(4),
			'Bills - List Recommendations From Payee'
		);
		const filteredRecommendation = recommendations
			.filter((item) => item.id)
			.map((item) => ({ ...item, id: item.id || '' }));
		const sortedRecommendations = filteredRecommendation.sort((a, b) => b.count - a.count);
		const totalFound = sortedRecommendations.reduce((acc, item) => acc + item.count, 0);

		return sortedRecommendations.map((item) => {
			return {
				id: item.id,
				title: item.title || '',
				fraction: totalFound > 0 ? item.count / totalFound : 0,
				count: item.count
			};
		});
	},
	generateCSVData: async ({ filter, returnType }) => {
		const data = await billActions.list({
			filter: { ...filter, page: 0, pageSize: 100000 }
		});

		const preppedData = data.data.map((item, row) => {
			if (returnType === 'import') {
				return {
					title: item.title,
					status: item.status
				} satisfies CreateBillSchemaType;
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
		await testingDelay();
		await streamingDelay();
		const items = dbExecuteLogger(
			db.select({ id: bill.id, title: bill.title, enabled: bill.allowUpdate }).from(bill),
			'Bill - List For Dropdown'
		);

		return items;
	},
	createOrGet: async ({ title, id, requireActive = true, cachedData }) => {
		const db = getContextDB();

		getLogger('bills').debug({
			code: 'BILL_040',
			title: 'Creating or getting bill',
			billId: id,
			billTitle: title,
			requireActive,
			usingCache: !!cachedData
		});

		await materializedViewActions.setRefreshRequired();
		if (id) {
			const currentBill = cachedData
				? cachedData.find((item) => item.id === id)
				: await dbExecuteLogger(
						db.query.bill.findFirst({
							where: eq(bill.id, id),
							columns: { id: true, title: true, status: true }
						}),
						'Bill - Create Or Get - By Id'
					);

			if (currentBill) {
				if (requireActive && currentBill.status !== 'active') {
					getLogger('bills').warn({
						code: 'BILL_041',
						title: 'Bill found but not active',
						billId: id,
						billStatus: currentBill.status
					});
					throw new Error(`Bill ${currentBill.title} is not active`);
				}
				getLogger('bills').debug({
					code: 'BILL_042',
					title: 'Found existing bill by ID',
					billId: id
				});
				return currentBill;
			}
			getLogger('bills').error({
				code: 'BILL_043',
				title: 'Bill not found by ID',
				billId: id
			});
			throw new Error(`Bill ${id} not found`);
		} else if (title) {
			const currentBill = cachedData
				? cachedData.find((item) => item.title === title)
				: await dbExecuteLogger(
						db.query.bill.findFirst({
							where: eq(bill.title, title),
							columns: { id: true, title: true, status: true }
						}),
						'Bill - Create Or Get - By Title'
					);
			if (currentBill) {
				if (requireActive && currentBill.status !== 'active') {
					getLogger('bills').warn({
						code: 'BILL_044',
						title: 'Bill found by title but not active',
						billTitle: title,
						billStatus: currentBill.status
					});
					throw new Error(`Bill ${currentBill.title} is not active`);
				}
				getLogger('bills').debug({
					code: 'BILL_045',
					title: 'Found existing bill by title',
					billTitle: title
				});
				return currentBill;
			}
			getLogger('bills').info({
				code: 'BILL_046',
				title: 'Creating new bill from title',
				billTitle: title
			});
			const newBillId = await billActions.create({
				title,
				status: 'active'
			});
			const newBill = await dbExecuteLogger(
				db.query.bill.findFirst({ where: eq(bill.id, newBillId) }),
				'Bill - Create Or Get - Check Created'
			);
			if (!newBill) {
				getLogger('bills').error({
					code: 'BILL_047',
					title: 'Failed to create bill from title',
					billTitle: title
				});
				throw new Error('Error Creating Bill');
			}
			getLogger('bills').info({
				code: 'BILL_048',
				title: 'Successfully created bill from title',
				billId: newBillId,
				billTitle: title
			});
			return newBill;
		} else {
			return undefined;
		}
	},
	create: async (data) => {
		const startTime = Date.now();
		const db = getContextDB();
		const id = nanoid();

		getLogger('bills').info({
			code: 'BILL_010',
			title: 'Creating new bill',
			billId: id,
			billTitle: data.title,
			status: data.status
		});

		try {
			await dbExecuteLogger(
				db.insert(bill).values(billCreateInsertionData(data, id)),
				'Bill - Create'
			);

			await materializedViewActions.setRefreshRequired();

			const duration = Date.now() - startTime;
			getLogger('bills').info({
				code: 'BILL_011',
				title: 'Bill created successfully',
				billId: id,
				duration
			});

			return id;
		} catch (e) {
			getLogger('bills').error({
				code: 'BILL_012',
				title: 'Failed to create bill',
				billId: id,
				error: e
			});
			throw e;
		}
	},
	createMany: async (data) => {
		const startTime = Date.now();
		const db = getContextDB();

		getLogger('bills').info({
			code: 'BILL_050',
			title: 'Creating multiple bills',
			count: data.length
		});

		try {
			const ids = data.map(() => nanoid());
			const insertData = data.map((currentData, index) =>
				billCreateInsertionData(currentData, ids[index])
			);
			await dbExecuteLogger(db.insert(bill).values(insertData), 'Bill - Create Many');

			await materializedViewActions.setRefreshRequired();

			const duration = Date.now() - startTime;
			getLogger('bills').info({
				code: 'BILL_051',
				title: 'Successfully created multiple bills',
				count: data.length,
				duration
			});

			return ids;
		} catch (e) {
			getLogger('bills').error({
				code: 'BILL_052',
				title: 'Failed to create multiple bills',
				count: data.length,
				error: e
			});
			throw e;
		}
	},
	update: async ({ data, id }) => {
		const startTime = Date.now();
		const db = getContextDB();

		getLogger('bills').debug({
			code: 'BILL_020',
			title: 'Starting bill update',
			billId: id,
			updateFields: Object.keys(data)
		});

		const currentBill = await dbExecuteLogger(
			db.query.bill.findFirst({ where: eq(bill.id, id) }),
			'Bill - Update - Get Current'
		);

		if (!currentBill) {
			getLogger('bills').error({
				code: 'BILL_021',
				title: 'Bill not found for update',
				billId: id
			});
			return id;
		}

		try {
			await dbExecuteLogger(
				db
					.update(bill)
					.set({
						...statusUpdate(data.status),
						...updatedTime(),
						title: data.title
					})
					.where(eq(bill.id, id)),
				'Bill - Update'
			);

			await materializedViewActions.setRefreshRequired();

			const duration = Date.now() - startTime;
			getLogger('bills').info({
				code: 'BILL_022',
				title: 'Bill updated successfully',
				billId: id,
				duration
			});

			return id;
		} catch (e) {
			getLogger('bills').error({
				code: 'BILL_023',
				title: 'Failed to update bill',
				billId: id,
				error: e
			});
			throw e;
		}
	},

	canDeleteMany: async (ids) => {
		const canDeleteList = await Promise.all(ids.map(async (id) => billActions.canDelete({ id })));

		return canDeleteList.reduce((prev, current) => (current === false ? false : prev), true);
	},
	canDelete: async (data) => {
		const db = getContextDB();
		const currentBill = await dbExecuteLogger(
			db.query.bill.findFirst({
				where: eq(bill.id, data.id),
				with: { journals: { limit: 1 } }
			}),
			'Bill - Can Delete - Get Current'
		);
		if (!currentBill) {
			return true;
		}

		return currentBill && currentBill.journals.length === 0;
	},
	delete: async (data) => {
		const db = getContextDB();

		getLogger('bills').info({
			code: 'BILL_030',
			title: 'Attempting to delete bill',
			billId: data.id
		});

		// If the bill has no journals, then mark as deleted, otherwise do nothing
		if (await billActions.canDelete(data)) {
			await dbExecuteLogger(db.delete(bill).where(eq(bill.id, data.id)), 'Bill - Delete');
			getLogger('bills').info({
				code: 'BILL_031',
				title: 'Bill deleted successfully',
				billId: data.id
			});
			await materializedViewActions.setRefreshRequired();
		} else {
			getLogger('bills').warn({
				code: 'BILL_032',
				title: 'Bill cannot be deleted - has journal entries',
				billId: data.id
			});
		}

		return data.id;
	},
	deleteMany: async (data) => {
		const db = getContextDB();
		if (data.length === 0) {
			getLogger('bills').debug({
				code: 'BILL_060',
				title: 'Delete many bills called with empty array'
			});
			return;
		}

		getLogger('bills').info({
			code: 'BILL_061',
			title: 'Attempting to delete multiple bills',
			count: data.length,
			billIds: data.map((item) => item.id)
		});

		const currentBills = await billActions.listWithTransactionCount();
		const itemsForDeletion = data.filter((item) => {
			const currentBill = currentBills.find((current) => current.id === item.id);
			return currentBill && currentBill.journalCount === 0;
		});

		if (itemsForDeletion.length === data.length) {
			await dbExecuteLogger(
				db.delete(bill).where(
					inArrayWrapped(
						bill.id,
						itemsForDeletion.map((item) => item.id)
					)
				),
				'Bill - Delete Many'
			);
			getLogger('bills').info({
				code: 'BILL_062',
				title: 'Successfully deleted multiple bills',
				count: itemsForDeletion.length
			});
			await materializedViewActions.setRefreshRequired();
			return true;
		} else {
			getLogger('bills').warn({
				code: 'BILL_063',
				title: 'Cannot delete all bills - some have journal entries',
				requested: data.length,
				eligible: itemsForDeletion.length
			});
			return false;
		}
	},
	seed: async (count) => {
		const db = getContextDB();
		getLogger('bills').info({
			code: 'BILL_070',
			title: 'Seeding Bills',
			count
		});

		try {
			const existingTitles = (
				await dbExecuteLogger(
					db.query.bill.findMany({ columns: { title: true } }),
					'Bill - Seed - Get Existing'
				)
			).map((item) => item.title);
			const itemsToCreate = createUniqueItemsOnly({
				existing: existingTitles,
				creationToString: (creation) => creation.title,
				createItem: createBill,
				count
			});

			getLogger('bills').debug({
				code: 'BILL_071',
				title: 'Creating unique bills for seeding',
				existing: existingTitles.length,
				toCreate: itemsToCreate.length
			});

			await billActions.createMany(itemsToCreate);

			getLogger('bills').info({
				code: 'BILL_072',
				title: 'Bills seeded successfully',
				count: itemsToCreate.length
			});
		} catch (e) {
			getLogger('bills').error({
				code: 'BILL_073',
				title: 'Failed to seed bills',
				count,
				error: e
			});
			throw e;
		}
	}
};
