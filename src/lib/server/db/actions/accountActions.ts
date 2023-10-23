import type {
	CreateAccountSchemaType,
	AccountFilterSchemaType,
	UpdateAccountSchemaType
} from '$lib/schema/accountSchema';
import { nanoid } from 'nanoid';
import type { DBType } from '../db';
import { account, journalEntry } from '../schema';
import { and, asc, desc, eq, getTableColumns, inArray, sql } from 'drizzle-orm';
import { statusUpdate } from './helpers/statusUpdate';
import { updatedTime } from './helpers/updatedTime';
import type { IdSchemaType } from '$lib/schema/idSchema';
import { logging } from '$lib/server/logging';
import { combinedAccountTitleSplitRequired } from '$lib/helpers/combinedAccountTitleSplit';
import {
	createAsset,
	createExpense,
	createIncome,
	createLiability
} from './helpers/seedAccountData';
import { accountFilterToQuery } from './helpers/accountFilterToQuery';
import { accountCreateInsertionData } from './helpers/accountCreateInsertionData';
import { accountTitleSplit } from './helpers/accountTitleSplit';

export const accountActions = {
	getById: async (db: DBType, id: string) => {
		return db.query.account.findFirst({ where: eq(account.id, id) }).execute();
	},
	count: async (db: DBType, filter?: AccountFilterSchemaType) => {
		const count = await db
			.select({ count: sql<number>`count(${account.id})`.mapWith(Number) })
			.from(account)
			.where(and(...(filter ? accountFilterToQuery(filter) : [])))
			.execute();

		return count[0].count;
	},
	listWithTransactionCount: async (db: DBType) => {
		const items = db
			.select({ id: account.id, journalCount: sql<number>`count(${journalEntry.id})` })
			.from(account)
			.leftJoin(journalEntry, eq(journalEntry.accountId, account.id))
			.groupBy(account.id)
			.execute();

		return items;
	},
	list: async ({ db, filter }: { db: DBType; filter?: AccountFilterSchemaType }) => {
		const {
			page = 0,
			pageSize = 10,
			orderBy,
			...restFilter
		} = filter || { page: 10, pageSize: 10 };

		const where = accountFilterToQuery(restFilter);
		const defaultOrderBy = [asc(account.title), desc(account.createdAt)];
		const orderByResult = orderBy
			? [
					...orderBy.map((currentOrder) =>
						currentOrder.direction === 'asc'
							? asc(account[currentOrder.field])
							: desc(account[currentOrder.field])
					),
					...defaultOrderBy
			  ]
			: defaultOrderBy;

		const results = await db
			.select({
				...getTableColumns(account),
				sum: sql`sum(${journalEntry.amount})`.mapWith(Number),
				count: sql`count(${journalEntry.id})`.mapWith(Number)
			})
			.from(account)
			.where(and(...where))
			.limit(pageSize)
			.offset(page * pageSize)
			.orderBy(...orderByResult)
			.leftJoin(journalEntry, eq(journalEntry.accountId, account.id))
			.groupBy(account.id)
			.execute();

		const resultCount = await db
			.select({ count: sql<number>`count(${account.id})`.mapWith(Number) })
			.from(account)
			.where(and(...where))
			.execute();

		const count = resultCount[0].count;
		const pageCount = Math.max(1, Math.ceil(count / pageSize));

		return { count, data: results, pageCount, page, pageSize };
	},
	listForDropdown: async ({ db }: { db: DBType }) => {
		const items = db
			.select({
				id: account.id,
				title: account.title,
				enabled: account.allowUpdate,
				group: account.accountGroupCombined
			})
			.from(account)
			.execute();

		return items;
	},

	create: async (db: DBType, data: CreateAccountSchemaType) => {
		const id = nanoid();
		await db.insert(account).values(accountCreateInsertionData(data, id));

		return id;
	},
	createOrGet: async ({
		db,
		title,
		id,
		requireActive = true
	}: {
		db: DBType;
		title?: string;
		id?: string;
		requireActive?: boolean;
	}) => {
		if (id) {
			const currentAccount = await db.query.account
				.findFirst({ where: eq(account.id, id) })
				.execute();

			if (currentAccount) {
				if (requireActive && currentAccount.status !== 'active') {
					throw new Error(`Account ${currentAccount.title} is not active`);
				}
				return currentAccount;
			}
			throw new Error(`Account ${id} not found`);
		} else if (title) {
			const accountTitleInfo = accountTitleSplit(title);

			const isExpense = accountTitleInfo.accountGroupCombined === '';

			const currentAccount = await db.query.account
				.findFirst({ where: eq(account.accountTitleCombined, title) })
				.execute();

			if (currentAccount) {
				if (requireActive && currentAccount.status !== 'active') {
					throw new Error(`Account ${currentAccount.title} is not active`);
				}
				return currentAccount;
			}

			logging.info('Starting To Create Account : ', { title });
			const newAccountId = await accountActions.create(db, {
				...accountTitleInfo,
				type: isExpense ? 'expense' : 'asset',
				status: 'active'
			});
			const newAccount = await db.query.account
				.findFirst({ where: eq(account.id, newAccountId) })
				.execute();
			if (!newAccount) {
				throw new Error(`Account Creation Error`);
			}
			return newAccount;
		} else {
			return undefined;
		}
	},
	update: async (db: DBType, data: UpdateAccountSchemaType) => {
		const { id } = data;
		const currentAccount = await db.query.account
			.findFirst({ where: eq(account.id, id) })
			.execute();

		if (!currentAccount || currentAccount.status === 'deleted') {
			logging.info('Update Account: Account not found or deleted');
			return id;
		}

		if (data.status && data.status === 'deleted') {
			logging.info('Update Account: Cannot Use Update To Set To Deleted');
			return id;
		}

		const changingToExpenseOrIncome =
			data.type &&
			(data.type === 'expense' || data.type === 'income') &&
			data.type !== currentAccount.type;

		//If an account is changed to an expense, then make sure that all the other aspects
		//of the account are correctly updated to how an expense would be created.
		if (changingToExpenseOrIncome) {
			await db
				.update(account)
				.set({
					type: data.type,
					...statusUpdate(data.status),
					...combinedAccountTitleSplitRequired({
						title: data.title || currentAccount.title,
						accountGroupCombined: ''
					}),
					...updatedTime(),
					startDate: null,
					endDate: null,
					isCash: false,
					isNetWorth: false
				})
				.where(eq(account.id, id))
				.execute();
		} else if (currentAccount.type === 'expense' || currentAccount.type === 'income') {
			//Limit what can be updated for an income or expense account
			await db
				.update(account)
				.set({
					type: data.type || currentAccount.type,
					...combinedAccountTitleSplitRequired({
						title: data.title || currentAccount.title,
						accountGroupCombined: ''
					}),
					...updatedTime()
				})
				.where(eq(account.id, id))
				.execute();
		} else {
			await db
				.update(account)
				.set({
					...data,
					...statusUpdate(data.status),
					...updatedTime(),
					...combinedAccountTitleSplitRequired({
						title: data.title || currentAccount.title,
						accountGroupCombined: data.accountGroupCombined || currentAccount.accountGroupCombined
					})
				})
				.where(eq(account.id, id))
				.execute();
		}
		return id;
	},
	canDeleteMany: async (db: DBType, ids: string[]) => {
		const canDeleteList = await Promise.all(
			ids.map(async (id) => accountActions.canDelete(db, { id }))
		);

		return canDeleteList.reduce((prev, current) => (current === false ? false : prev), true);
	},
	canDelete: async (db: DBType, data: IdSchemaType) => {
		const currentAccount = await db.query.account
			.findFirst({ where: eq(account.id, data.id), with: { journals: { limit: 1 } } })
			.execute();
		if (!currentAccount) {
			return true;
		}
		return currentAccount && currentAccount.journals.length === 0;
	},
	delete: async (db: DBType, data: IdSchemaType) => {
		// If the account has no journals, then mark as deleted, otherwise do nothing
		if (await accountActions.canDelete(db, data)) {
			await db.delete(account).where(eq(account.id, data.id)).execute();
		}

		return data.id;
	},
	deleteMany: async (db: DBType, data: IdSchemaType[]) => {
		const currentAccounts = await accountActions.listWithTransactionCount(db);
		const itemsForDeletion = data.filter((item) => {
			const currentAccount = currentAccounts.find((current) => current.id === item.id);
			return currentAccount && currentAccount.journalCount === 0;
		});
		if (itemsForDeletion.length === data.length) {
			await db
				.delete(account)
				.where(
					inArray(
						account.id,
						itemsForDeletion.map((item) => item.id)
					)
				)
				.execute();
			return true;
		}
		return false;
	},
	undelete: async (db: DBType, data: IdSchemaType) => {
		const currentAccount = await db.query.account
			.findFirst({ where: eq(account.id, data.id) })
			.execute();
		if (currentAccount && currentAccount.deleted) {
			await db
				.update(account)
				.set({ ...statusUpdate('active'), ...updatedTime() })
				.where(eq(account.id, data.id))
				.execute();
		}
	},
	createMany: async (db: DBType, data: CreateAccountSchemaType[]) => {
		const dataForInsertion = data.map((currentAccount) => {
			const id = nanoid();
			return accountCreateInsertionData(currentAccount, id);
		});

		await db.insert(account).values(dataForInsertion);

		return dataForInsertion.map((item) => item.id);
	},
	seed: async (
		db: DBType,
		{
			countAssets,
			countLiabilities,
			countIncome,
			countExpenses
		}: {
			countAssets: number;
			countLiabilities: number;
			countIncome: number;
			countExpenses: number;
		}
	) => {
		logging.info('Seeding Accounts : ', {
			countAssets,
			countLiabilities,
			countIncome,
			countExpenses
		});
		const assetsToCreate = Array(countAssets)
			.fill(1)
			.map(() => createAsset());
		const liabilitiesToCreate = Array(countLiabilities)
			.fill(1)
			.map(() => createLiability());
		const incomeToCreate = Array(countIncome)
			.fill(1)
			.map(() => createIncome());
		const expensesToCreate = Array(countExpenses)
			.fill(1)
			.map(() => createExpense());

		const itemsToCreate = [
			...assetsToCreate,
			...liabilitiesToCreate,
			...incomeToCreate,
			...expensesToCreate
		];

		await accountActions.createMany(db, itemsToCreate);
	}
};
