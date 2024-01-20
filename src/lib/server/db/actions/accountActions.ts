import {
	type CreateAccountSchemaType,
	type AccountFilterSchemaType,
	type UpdateAccountSchemaType,
	updateAccountSchema
} from '$lib/schema/accountSchema';
import { nanoid } from 'nanoid';
import type { DBType } from '../db';
import { account } from '../postgres/schema';
import { and, asc, desc, eq, inArray } from 'drizzle-orm';
import { statusUpdate } from './helpers/misc/statusUpdate';
import { updatedTime } from './helpers/misc/updatedTime';
import type { IdSchemaType } from '$lib/schema/idSchema';
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
import type { StatusEnumType } from '$lib/schema/statusSchema';
import { materializedViewActions } from './materializedViewActions';
import { accountMaterializedView } from '../postgres/schema/materializedViewSchema';

export const accountActions = {
	getById: async (db: DBType, id: string) => {
		return db.query.account.findFirst({ where: eq(account.id, id) }).execute();
	},
	count: async (db: DBType, filter?: AccountFilterSchemaType) => {
		const count = await db
			.select({ count: drizzleCount(account.id) })
			.from(accountMaterializedView)
			.where(and(...(filter ? accountFilterToQuery({ filter }) : [])))
			.execute();

		return count[0].count;
	},
	listWithTransactionCount: async (db: DBType) => {
		await materializedViewActions.conditionalRefresh({ db });

		const items = db
			.select({ id: accountMaterializedView.id, journalCount: accountMaterializedView.count })
			.from(accountMaterializedView)
			.execute();

		return items;
	},
	list: async ({ db, filter }: { db: DBType; filter?: AccountFilterSchemaType }) => {
		await materializedViewActions.conditionalRefresh({ db });
		const {
			page = 0,
			pageSize = 10,
			orderBy,
			...restFilter
		} = filter || { page: 10, pageSize: 10 };

		const where = accountFilterToQuery({ filter: restFilter, target: 'accountWithSummary' });
		const defaultOrderBy = [
			asc(accountMaterializedView.title),
			desc(accountMaterializedView.createdAt)
		];
		const orderByResult = orderBy
			? [
					...orderBy.map((currentOrder) =>
						currentOrder.direction === 'asc'
							? asc(accountMaterializedView[currentOrder.field])
							: desc(accountMaterializedView[currentOrder.field])
					),
					...defaultOrderBy
				]
			: defaultOrderBy;

		const results = await db
			.select()
			.from(accountMaterializedView)
			.where(and(...where))
			.limit(pageSize)
			.offset(page * pageSize)
			.orderBy(...orderByResult)
			.execute();

		const resultCount = await db
			.select({ count: drizzleCount(account.id) })
			.from(accountMaterializedView)
			.where(and(...where))
			.execute();

		const count = resultCount[0].count;
		const pageCount = Math.max(1, Math.ceil(count / pageSize));

		return { count, data: results, pageCount, page, pageSize };
	},
	listForDropdown: async ({ db }: { db: DBType }) => {
		await streamingDelay();
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
	listCommonProperties: async ({ db, filter }: { db: DBType; filter: AccountFilterSchemaType }) => {
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
	create: async (db: DBType, data: CreateAccountSchemaType) => {
		const id = nanoid();

		await db.insert(account).values(accountCreateInsertionData(data, id));

		await materializedViewActions.setRefreshRequired(db);

		return id;
	},
	createAndGet: async (db: DBType, data: CreateAccountSchemaType) => {
		const id = await accountActions.create(db, data);
		return db.query.account.findFirst({ where: eq(account.id, id) }).execute();
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
			const currentAccount = cachedData
				? cachedData.find((item) => item.id === id)
				: await db.query.account.findFirst({ where: eq(account.id, id) }).execute();

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
				: await db.query.account
						.findFirst({ where: eq(account.accountTitleCombined, title) })
						.execute();

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
	updateMany: async ({
		db,
		data,
		filter
	}: {
		db: DBType;
		data: UpdateAccountSchemaType;
		filter: AccountFilterSchemaType;
	}) => {
		const processedData = updateAccountSchema.safeParse(data);

		if (!processedData.success) {
			throw new Error('Invalid Data');
		}

		const items = await accountActions.list({
			db,
			filter: { ...filter, pageSize: 100000, page: 0 }
		});

		await db.transaction(async (db) => {
			await Promise.all(
				items.data.map(async (item) => {
					await accountActions.update({ db, data, id: item.id });
				})
			);
		});
	},
	update: async ({ db, data, id }: { db: DBType; data: UpdateAccountSchemaType; id: string }) => {
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
		const currentAccount = await db.query.account
			.findFirst({ where: eq(account.id, id) })
			.execute();

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
			await db
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
				.where(eq(account.id, id))
				.execute();
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

			await db
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
				.where(eq(account.id, id))
				.execute();

			const matchingAccount = await db.select().from(account).where(eq(account.id, id)).execute();
			console.log('New Update Time = ', matchingAccount[0].updatedAt);
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

		await materializedViewActions.setRefreshRequired(db);
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
			await materializedViewActions.setRefreshRequired(db);
		}
		return false;
	},
	createMany: async (db: DBType, data: CreateAccountSchemaType[]) => {
		const dataForInsertion = data.map((currentAccount) => {
			const id = nanoid();
			return accountCreateInsertionData(currentAccount, id);
		});

		await db.transaction(async (db) => {
			await db.insert(account).values(dataForInsertion);
		});

		await materializedViewActions.setRefreshRequired(db);
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
		await materializedViewActions.setRefreshRequired(db);
	}
};
