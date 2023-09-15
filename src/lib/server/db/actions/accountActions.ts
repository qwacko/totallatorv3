import type {
	CreateAccountSchemaType,
	AccountFilterSchemaType,
	UpdateAccountSchemaType
} from '$lib/schema/accountSchema';
import { nanoid } from 'nanoid';
import type { DBType } from '../db';
import { account } from '../schema';
import { SQL, and, asc, desc, eq, like, not, sql } from 'drizzle-orm';
import { statusUpdate } from './helpers/statusUpdate';
import { updatedTime } from './helpers/updatedTime';
import type { IdSchemaType } from '$lib/schema/idSchema';
import { logging } from '$lib/server/logging';
import { combinedAccountTitleSplitRequired } from '$lib/helpers/combinedAccountTitleSplit';

export const accountActions = {
	getById: async (db: DBType, id: string) => {
		return db.query.account.findFirst({ where: eq(account.id, id) }).execute();
	},
	list: async (db: DBType, filter: AccountFilterSchemaType) => {
		const { page = 0, pageSize = 10, orderBy, ...restFilter } = filter;

		const where: SQL<unknown>[] = [];
		if (restFilter.id) where.push(eq(account.id, restFilter.id));
		if (restFilter.title) where.push(like(account.title, `%${restFilter.title}%`));
		if (restFilter.accountGroup)
			where.push(like(account.accountGroup, `%${restFilter.accountGroup}%`));
		if (restFilter.accountGroup2)
			where.push(like(account.accountGroup2, `%${restFilter.accountGroup2}%`));
		if (restFilter.accountGroup3)
			where.push(like(account.accountGroup3, `%${restFilter.accountGroup3}%`));
		if (restFilter.accountGroupCombined)
			where.push(like(account.accountGroupCombined, `%${restFilter.accountGroupCombined}%`));
		if (restFilter.accountTitleCombined)
			where.push(like(account.accountTitleCombined, `%${restFilter.accountTitleCombined}%`));
		if (restFilter.status) where.push(eq(account.status, restFilter.status));
		else where.push(not(eq(account.status, 'deleted')));
		if (restFilter.deleted) where.push(eq(account.deleted, restFilter.deleted));
		if (restFilter.disabled) where.push(eq(account.disabled, restFilter.disabled));
		if (restFilter.allowUpdate) where.push(eq(account.allowUpdate, restFilter.allowUpdate));
		if (restFilter.active) where.push(eq(account.active, restFilter.active));

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

		const results = db.query.account
			.findMany({
				where: and(...where),
				offset: page * pageSize,
				limit: pageSize,
				orderBy: orderByResult
			})
			.execute();

		const resultCount = await db
			.select({ count: sql<number>`count(${account.id})`.mapWith(Number) })
			.from(account)
			.where(and(...where))
			.execute();

		const count = resultCount[0].count;
		const pageCount = Math.max(1, Math.ceil(count / pageSize));

		return { count, data: await results, pageCount, page, pageSize };
	},
	create: async (db: DBType, data: CreateAccountSchemaType) => {
		const id = nanoid();
		await db
			.insert(account)
			.values({
				id,
				...statusUpdate(data.status),
				...updatedTime(),
				...combinedAccountTitleSplitRequired(data)
			})
			.execute();

		return id;
	},
	update: async (db: DBType, data: UpdateAccountSchemaType) => {
		const { id } = data;
		const currentAccount = await db.query.account
			.findFirst({ where: eq(account.id, id) })
			.execute();
		logging.info('Update Account: ', data, currentAccount);

		if (!currentAccount || currentAccount.status === 'deleted') {
			logging.info('Update Account: Account not found or deleted');
			return id;
		}

		if (data.status && data.status === 'deleted') {
			logging.info('Update Account: Cannot Use Update To Set To Deleted');
			return id;
		}

		await db
			.update(account)
			.set({
				...statusUpdate(data.status),
				...updatedTime(),
				...combinedAccountTitleSplitRequired({
					title: data.title || currentAccount.title,
					accountGroupCombined: data.accountGroupCombined || currentAccount.accountGroupCombined
				})
			})
			.where(eq(account.id, id))
			.execute();

		return id;
	},
	delete: async (db: DBType, data: IdSchemaType) => {
		const currentAccount = await db.query.account
			.findFirst({ where: eq(account.id, data.id), with: { journals: { limit: 1 } } })
			.execute();

		// If the account has no journals, then mark as deleted, otherwise do nothing
		if (currentAccount && currentAccount.journals.length === 0) {
			await db
				.update(account)
				.set({ ...statusUpdate('deleted'), ...updatedTime() })
				.where(eq(account.id, data.id))
				.execute();
		}

		return data.id;
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
	}
};
