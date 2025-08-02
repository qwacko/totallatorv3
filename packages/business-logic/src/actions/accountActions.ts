import {
	type CreateAccountSchemaType,
	type AccountFilterSchemaType,
	type UpdateAccountSchemaType,
	updateAccountSchema
} from '@totallator/shared';
import { nanoid } from 'nanoid';
import { account, type AccountTableType, type AccountViewReturnType } from '@totallator/database';
import { and, asc, desc, eq, max } from 'drizzle-orm';
import { statusUpdate } from './helpers/misc/statusUpdate';
import { updatedTime } from './helpers/misc/updatedTime';
import { getLogger } from '@/logger';
import { combinedAccountTitleSplitRequired } from '../helpers/combinedAccountTitleSplit';
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
import { streamingDelay } from '../server/testingDelay';
import { count as drizzleCount } from 'drizzle-orm';
import { materializedViewActions } from './materializedViewActions';
import { inArrayWrapped } from './helpers/misc/inArrayWrapped';
import { dbExecuteLogger } from '@/server/db/dbLogger';
import { getCorrectAccountTable } from './helpers/account/getCorrectAccountTable';
import type { ItemActionsType } from './helpers/misc/ItemActionsType';
import Papa from 'papaparse';
import { getContextDB, runInTransactionWithLogging } from '@totallator/context';

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
	filter?: AccountFilterSchemaType;
}) => Promise<UpdateAccountSchemaType>;

type UpdateManyAccountsFunction = (data: {
	data: UpdateAccountSchemaType;
	filter: AccountFilterSchemaType;
}) => Promise<void>;

type CreateAndGetAccountFunction = (
	data: CreateAccountSchemaType
) => Promise<AccountTableType | undefined>;

export const accountActions: AccountActionsType & {
	listCommonProperties: ListCommonPropertiesFunction;
	updateMany: UpdateManyAccountsFunction;
	createAndGet: CreateAndGetAccountFunction;
} = {
	latestUpdate: async () => {
		const db = getContextDB();
		const latestUpdate = await dbExecuteLogger(
			db.select({ lastUpdated: max(account.updatedAt) }).from(account),
			'Accounts - Latest Update'
		);
		return latestUpdate[0].lastUpdated || new Date();
	},
	getById: async (id) => {
		const db = getContextDB();
		return dbExecuteLogger(
			db.query.account.findFirst({ where: eq(account.id, id) }),
			'Accounts - Get By ID'
		);
	},
	count: async (filter) => {
		const db = getContextDB();
		const { table, target } = await getCorrectAccountTable();

		const count = await dbExecuteLogger(
			db
				.select({ count: drizzleCount(table.id) })
				.from(table)
				.where(and(...(filter ? accountFilterToQuery({ filter: filter, target }) : []))),
			'Accounts - Count'
		);

		return count[0].count;
	},
	listWithTransactionCount: async () => {
		const db = getContextDB();
		const { table } = await getCorrectAccountTable();

		const items = dbExecuteLogger(
			db.select({ id: table.id, journalCount: table.count }).from(table),
			'Accounts - List With Transaction Count'
		);

		return items;
	},
	list: async ({ filter }) => {
		const db = getContextDB();
		const { table, target } = await getCorrectAccountTable();

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
	generateCSVData: async ({ filter, returnType }) => {
		const data = await accountActions.list({
			filter: { ...filter, page: 0, pageSize: 100000 }
		});

		const preppedData = data.data.map((item, row) => {
			if (returnType === 'import') {
				return {
					title: item.title,
					accountGroupCombined: item.accountGroupCombined,
					type: item.type,
					startDate: item.startDate || undefined,
					endDate: item.endDate || undefined,
					isCash: item.isCash,
					isNetWorth: item.isNetWorth,
					status: item.status
				} satisfies CreateAccountSchemaType;
			}
			return {
				row,
				id: item.id,
				status: item.status,
				type: item.type,
				title: item.title,
				accountGroup: item.accountGroup,
				accountGroup2: item.accountGroup2,
				accountGroup3: item.accountGroup3,
				accountGroupCombined: item.accountGroupCombined,
				accountTitleCombined: item.accountTitleCombined,
				isCash: item.isCash,
				isNetWorth: item.isNetWorth,
				startDate: item.startDate,
				endDate: item.endDate,
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
	listCommonProperties: async ({ filter }) => {
		const { data: accounts } = await accountActions.list({
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
	create: async (data) => {
		const db = getContextDB();
		const id = nanoid();

		await dbExecuteLogger(
			db.insert(account).values(accountCreateInsertionData(data, id)),
			'Accounts - Create'
		);

		await materializedViewActions.setRefreshRequired();

		return id;
	},
	createAndGet: async (data) => {
		const db = getContextDB();
		const id = await accountActions.create(data);
		return dbExecuteLogger(
			db.query.account.findFirst({ where: eq(account.id, id) }),
			'Accounts - Create And Get - Get'
		);
	},
	createOrGet: async ({ title, id, requireActive = true, cachedData }) => {
		const db = getContextDB();
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

			const newAccountId = await accountActions.create({
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
	updateMany: async ({ data, filter }) => {
		const processedData = updateAccountSchema.safeParse(data);

		if (!processedData.success) {
			throw new Error('Invalid Data');
		}

		const items = await accountActions.list({
			filter: { ...filter, pageSize: 100000, page: 0 }
		});

		await runInTransactionWithLogging('Update Many Accounts', async () => {
			await Promise.all(
				items.data.map(async (item) => {
					await accountActions.update({ data, id: item.id });
				})
			);
		});
	},
	update: async ({ data, id }) => {
		const db = getContextDB();
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

		await materializedViewActions.setRefreshRequired();
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
	canDeleteMany: async (ids) => {
		const canDeleteList = await Promise.all(
			ids.map(async (id) => accountActions.canDelete({ id }))
		);

		return canDeleteList.reduce((prev, current) => (current === false ? false : prev), true);
	},
	canDelete: async (data) => {
		const db = getContextDB();
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
	delete: async (data) => {
		const db = getContextDB();
		// If the account has no journals, then mark as deleted, otherwise do nothing
		if (await accountActions.canDelete(data)) {
			await dbExecuteLogger(db.delete(account).where(eq(account.id, data.id)), 'Accounts - Delete');
		}

		await materializedViewActions.setRefreshRequired();
		return data.id;
	},
	deleteMany: async (data) => {
		const db = getContextDB();
		const currentAccounts = await accountActions.listWithTransactionCount();
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
			await materializedViewActions.setRefreshRequired();
			return true;
		}
		return false;
	},
	createMany: async (data) => {
		const dataForInsertion = data.map((currentAccount) => {
			const id = nanoid();
			return accountCreateInsertionData(currentAccount, id);
		});

		await runInTransactionWithLogging('Create Many Accounts', async (trx) => {
			await dbExecuteLogger(trx.insert(account).values(dataForInsertion), 'Accounts - Create Many');
		});

		await materializedViewActions.setRefreshRequired();
		return dataForInsertion.map((item) => item.id);
	},
	seed: async ({ countAssets, countLiabilities, countIncome, countExpenses }) => {
		getLogger().info('Seeding Accounts : ', {
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

		await accountActions.createMany(itemsToCreate);
		await materializedViewActions.setRefreshRequired();
	}
};
