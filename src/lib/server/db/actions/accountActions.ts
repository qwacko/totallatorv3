import {
	type CreateAccountSchemaType,
	type AccountFilterSchemaType,
	type UpdateAccountSchemaType,
	updateAccountSchema
} from '$lib/schema/accountSchema';
import { nanoid } from 'nanoid';
import type { DBType } from '../db';
import { account, type AccountTableType, type AccountViewReturnType } from '../postgres/schema';
import { and, asc, desc, eq, max } from 'drizzle-orm';
import { statusUpdate } from './helpers/misc/statusUpdate';
import { updatedTime } from './helpers/misc/updatedTime';
import { logging } from '$lib/server/logging';
import { combinedAccountTitleSplitRequired } from '$lib/helpers/combinedAccountTitleSplit';
import {
	createAsset,
	createExpense,
	createIncome,
	createLiability
} from './helpers/seed/seedAccountData';
import { accountFilterToQuery } from './helpers/account/accountFilterToQuery';
import { accountCreateInsertionData } from './helpers/account/accountCreateInsertionData';
import { accountTitleSplit } from './helpers/account/accountTitleSplit';
import { getCommonData } from './helpers/misc/getCommonData';
import { streamingDelay } from '$lib/server/testingDelay';
import { count as drizzleCount } from 'drizzle-orm';
import { materializedViewActions } from './materializedViewActions';
import { inArrayWrapped } from './helpers/misc/inArrayWrapped';
import { dbExecuteLogger } from '../dbLogger';
import { tLogger } from '../transactionLogger';
import { getCorrectAccountTable } from './helpers/account/getCorrectAccountTable';
import type { ItemActionsType } from './helpers/misc/ItemActionsType';

export type AccountDropdownType = {
	id: string;
	title: string;
	enabled: boolean;
	group: string;
}[];

type AccountActionsType = ItemActionsType<
	AccountTableType,
	AccountViewReturnType,
	AccountFilterSchemaType,
	CreateAccountSchemaType,
	UpdateAccountSchemaType,
	AccountDropdownType,
	{ countAssets: number; countLiabilities: number; countIncome: number; countExpenses: number }
>;

type ListCommonPropertiesFunction = (data: {
	db: DBType;
	filter?: AccountFilterSchemaType;
}) => Promise<UpdateAccountSchemaType>;

type UpdateManyAccountsFunction = (data: {
	db: DBType;
	data: UpdateAccountSchemaType;
	filter: AccountFilterSchemaType;
}) => Promise<void>;

type CreateAndGetAccountFunction = (
	db: DBType,
	data: CreateAccountSchemaType
) => Promise<AccountTableType | undefined>;

export const accountActions: AccountActionsType & {
	listCommonProperties: ListCommonPropertiesFunction;
	updateMany: UpdateManyAccountsFunction;
	createAndGet: CreateAndGetAccountFunction;
} = {
	latestUpdate: async ({ db }) => {
		const latestUpdate = await dbExecuteLogger(
			db.select({ lastUpdated: max(account.updatedAt) }).from(account),
			'Accounts - Latest Update'
		);
		return latestUpdate[0].lastUpdated || new Date();
	},
	getById: async (db, id) => {
		return dbExecuteLogger(
			db.query.account.findFirst({ where: eq(account.id, id) }),
			'Accounts - Get By ID'
		);
	},
	count: async (db, filter) => {
		const { table, target } = await getCorrectAccountTable(db);

		const count = await dbExecuteLogger(
			db
				.select({ count: drizzleCount(table.id) })
				.from(table)
				.where(and(...(filter ? accountFilterToQuery({ filter: filter, target }) : []))),
			'Accounts - Count'
		);

		return count[0].count;
	},
	listWithTransactionCount: async (db) => {
		const { table } = await getCorrectAccountTable(db);

		const items = dbExecuteLogger(
			db.select({ id: table.id, journalCount: table.count }).from(table),
			'Accounts - List With Transaction Count'
		);

		return items;
	},
	list: async ({ db, filter }) => {
		const { table, target } = await getCorrectAccountTable(db);

		const {
			page = 0,
			pageSize = 10,
			orderBy,
			...restFilter
		} = filter || { page: 10, pageSize: 10 };

		const where = accountFilterToQuery({ filter: restFilter, target });
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

		const results: AccountViewReturnType[] = await dbExecuteLogger(
			db
				.select()
				.from(table)
				.where(and(...where))
				.limit(pageSize)
				.offset(page * pageSize)
				.orderBy(...orderByResult),
			'Accounts - List'
		);

		const resultCount: { count: number }[] = await dbExecuteLogger(
			db
				.select({ count: drizzleCount(table.id) })
				.from(table)
				.where(and(...where)),
			'Accounts - List - Count'
		);

		const count = resultCount[0].count;
		const pageCount = Math.max(1, Math.ceil(count / pageSize));

		return { count, data: results, pageCount, page, pageSize };
	},
	listForDropdown: async ({ db }) => {
		await streamingDelay();
		const items = await dbExecuteLogger(
			db
				.select({
					id: account.id,
					title: account.title,
					enabled: account.allowUpdate,
					group: account.accountGroupCombined
				})
				.from(account),
			'Accounts - List For Dropdown'
		);

		return items;
	},
	listCommonProperties: async ({ db, filter }) => {
		const { data: accounts } = await accountActions.list({
			db,
			filter: { ...filter, page: 0, pageSize: 1000000 }
		});

		const title = getCommonData('title', accounts);
		const accountGroup = getCommonData('accountGroup', accounts);
		const accountGroup2 = getCommonData('accountGroup2', accounts);
		const accountGroup3 = getCommonData('accountGroup3', accounts);
		const accountGroupCombined = getCommonData('accountGroupCombined', accounts);
		const type = getCommonData('type', accounts);
		const isNetWorth = getCommonData('isNetWorth', accounts);
		const isCash = getCommonData('isCash', accounts);
		const startDate = getCommonData('startDate', accounts);
		const endDate = getCommonData('endDate', accounts);
		const status = getCommonData('status', accounts);

		return {
			title,
			status,
			accountGroup,
			accountGroup2,
			accountGroup3,
			accountGroupCombined,
			accountGroupClear: false,
			accountGroup2Clear: false,
			accountGroup3Clear: false,
			accountGroupCombinedClear: false,
			type,
			isNetWorth,
			isCash,
			startDate,
			endDate
		};
	},
	create: async (db, data) => {
		const id = nanoid();

		await dbExecuteLogger(
			db.insert(account).values(accountCreateInsertionData(data, id)),
			'Accounts - Create'
		);

		await materializedViewActions.setRefreshRequired(db);

		return id;
	},
	createAndGet: async (db, data) => {
		const id = await accountActions.create(db, data);
		return dbExecuteLogger(
			db.query.account.findFirst({ where: eq(account.id, id) }),
			'Accounts - Create And Get - Get'
		);
	},
	createOrGet: async ({ db, title, id, requireActive = true, cachedData }) => {
		if (id) {
			const currentAccount = cachedData
				? cachedData.find((item) => item.id === id)
				: await dbExecuteLogger(
						db.query.account.findFirst({
							where: eq(account.id, id),
							columns: { id: true, title: true, status: true }
						})
					);

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

			const currentAccount = cachedData
				? cachedData.find((item) => item.title === title)
				: await dbExecuteLogger(
						db.query.account.findFirst({
							where: eq(account.accountTitleCombined, title),
							columns: { id: true, title: true, status: true }
						}),
						'Accounts - Create Or Get - Check Exists'
					);

			if (currentAccount) {
				if (requireActive && currentAccount.status !== 'active') {
					throw new Error(`Account ${currentAccount.title} is not active`);
				}
				return currentAccount;
			}

			const newAccountId = await accountActions.create(db, {
				...accountTitleInfo,
				type: isExpense ? 'expense' : 'asset',
				status: 'active'
			});
			const newAccount = await dbExecuteLogger(
				db.query.account.findFirst({ where: eq(account.id, newAccountId) }),
				'Accounts - Create Or Get - Check Created'
			);
			if (!newAccount) {
				throw new Error(`Account Creation Error`);
			}
			return newAccount;
		} else {
			return undefined;
		}
	},
	updateMany: async ({ db, data, filter }) => {
		const processedData = updateAccountSchema.safeParse(data);

		if (!processedData.success) {
			throw new Error('Invalid Data');
		}

		const items = await accountActions.list({
			db,
			filter: { ...filter, pageSize: 100000, page: 0 }
		});

		await tLogger(
			'Update Many Accounts',
			db.transaction(async (db) => {
				await Promise.all(
					items.data.map(async (item) => {
						await accountActions.update({ db, data, id: item.id });
					})
				);
			})
		);
	},
	update: async ({ db, data, id }) => {
		const {
			accountGroup2,
			accountGroup3,
			accountGroup,
			accountGroupCombined,
			accountGroupClear,
			accountGroup2Clear,
			accountGroup3Clear,
			accountGroupCombinedClear,
			title,
			status,
			type,
			...restData
		} = data;
		const currentAccount = await dbExecuteLogger(
			db.query.account.findFirst({ where: eq(account.id, id) }),
			'Accounts - Update - Get'
		);

		if (!currentAccount) {
			throw new Error(`Account ${id} not found`);
		}

		await materializedViewActions.setRefreshRequired(db);
		const changingToExpenseOrIncome =
			type && (type === 'expense' || type === 'income') && type !== currentAccount.type;

		const changingToAssetOrLiability =
			type && (type === 'asset' || type === 'liability') && type !== currentAccount.type;

		//If an account is changed to an expense, then make sure that all the other aspects
		//of the account are correctly updated to how an expense would be created.
		if (
			(currentAccount.type === 'expense' ||
				currentAccount.type === 'income' ||
				changingToExpenseOrIncome) &&
			!changingToAssetOrLiability
		) {
			//Limit what can be updated for an income or expense account
			await dbExecuteLogger(
				db
					.update(account)
					.set({
						type: type || currentAccount.type,
						...statusUpdate(status),
						...combinedAccountTitleSplitRequired({
							title: title || currentAccount.title,
							accountGroupCombined: ''
						}),
						...updatedTime()
					})
					.where(eq(account.id, id)),
				'Accounts - Update - Expense Or Income'
			);
		} else {
			const newAccountGroupCombined = accountGroupCombinedClear
				? ''
				: accountGroupCombined && accountGroupCombined !== ''
					? accountGroupCombined
					: [
							accountGroupClear ? undefined : accountGroup || currentAccount.accountGroup,
							accountGroup2Clear ? undefined : accountGroup2 || currentAccount.accountGroup2,
							accountGroup3Clear ? undefined : accountGroup3 || currentAccount.accountGroup3
						]
							.filter((item) => item)
							.join(':');

			const { startDate, endDate, isCash, isNetWorth } = restData;

			await dbExecuteLogger(
				db
					.update(account)
					.set({
						startDate,
						endDate,
						isCash,
						isNetWorth,
						type: type || currentAccount.type,
						...statusUpdate(status),
						...combinedAccountTitleSplitRequired({
							title: title || currentAccount.title,
							accountGroupCombined: newAccountGroupCombined
						}),
						...updatedTime()
					})
					.where(eq(account.id, id)),
				'Accounts - Update - Asset Or Liability'
			);
		}
		return id;
	},
	canDeleteMany: async (db, ids) => {
		const canDeleteList = await Promise.all(
			ids.map(async (id) => accountActions.canDelete(db, { id }))
		);

		return canDeleteList.reduce((prev, current) => (current === false ? false : prev), true);
	},
	canDelete: async (db, data) => {
		const currentAccount = await dbExecuteLogger(
			db.query.account.findFirst({
				where: eq(account.id, data.id),
				with: { journals: { limit: 1 } }
			}),
			'Accounts - Can Delete'
		);
		if (!currentAccount) {
			return true;
		}
		return currentAccount && currentAccount.journals.length === 0;
	},
	delete: async (db, data) => {
		// If the account has no journals, then mark as deleted, otherwise do nothing
		if (await accountActions.canDelete(db, data)) {
			await dbExecuteLogger(db.delete(account).where(eq(account.id, data.id)), 'Accounts - Delete');
		}

		await materializedViewActions.setRefreshRequired(db);
		return data.id;
	},
	deleteMany: async (db, data) => {
		const currentAccounts = await accountActions.listWithTransactionCount(db);
		const itemsForDeletion = data.filter((item) => {
			const currentAccount = currentAccounts.find((current) => current.id === item.id);
			return currentAccount && currentAccount.journalCount === 0;
		});
		if (itemsForDeletion.length === data.length) {
			await dbExecuteLogger(
				db.delete(account).where(
					inArrayWrapped(
						account.id,
						itemsForDeletion.map((item) => item.id)
					)
				),
				'Accounts - Delete Many'
			);
			await materializedViewActions.setRefreshRequired(db);
			return true;
		}
		return false;
	},
	createMany: async (db, data) => {
		const dataForInsertion = data.map((currentAccount) => {
			const id = nanoid();
			return accountCreateInsertionData(currentAccount, id);
		});

		await tLogger(
			'Create Many Accounts',
			db.transaction(async (trx) => {
				await dbExecuteLogger(
					trx.insert(account).values(dataForInsertion),
					'Accounts - Create Many'
				);
			})
		);

		await materializedViewActions.setRefreshRequired(db);
		return dataForInsertion.map((item) => item.id);
	},
	seed: async (db: DBType, { countAssets, countLiabilities, countIncome, countExpenses }) => {
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
		await materializedViewActions.setRefreshRequired(db);
	}
};
