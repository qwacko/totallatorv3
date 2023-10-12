import type { AccountFilterSchemaType } from '$lib/schema/accountSchema';
import { db } from '../../db';
import { account } from '../../schema';
import { SQL, eq, gt, inArray, like, lt, not } from 'drizzle-orm';

export const accountFilterToQuery = (
	filter: Omit<AccountFilterSchemaType, 'pageNo' | 'pageSize' | 'orderBy'>
) => {
	const where: SQL<unknown>[] = [];
	if (filter.id) where.push(eq(account.id, filter.id));
	if (filter.idArray) where.push(inArray(account.id, filter.idArray));
	if (filter.title) where.push(like(account.title, `%${filter.title}%`));
	if (filter.accountGroup) where.push(like(account.accountGroup, `%${filter.accountGroup}%`));
	if (filter.accountGroup2) where.push(like(account.accountGroup2, `%${filter.accountGroup2}%`));
	if (filter.accountGroup3) where.push(like(account.accountGroup3, `%${filter.accountGroup3}%`));
	if (filter.accountGroupCombined)
		where.push(like(account.accountGroupCombined, `%${filter.accountGroupCombined}%`));
	if (filter.accountTitleCombined)
		where.push(like(account.accountTitleCombined, `%${filter.accountTitleCombined}%`));
	if (filter.status) where.push(eq(account.status, filter.status));
	else where.push(not(eq(account.status, 'deleted')));
	if (filter.deleted !== undefined) where.push(eq(account.deleted, filter.deleted));
	if (filter.disabled !== undefined) where.push(eq(account.disabled, filter.disabled));
	if (filter.allowUpdate !== undefined) where.push(eq(account.allowUpdate, filter.allowUpdate));
	if (filter.active !== undefined) where.push(eq(account.active, filter.active));
	if (filter.isCash !== undefined) where.push(eq(account.isCash, filter.isCash));
	if (filter.isNetWorth !== undefined) where.push(eq(account.isNetWorth, filter.isNetWorth));
	if (filter.startDateAfter !== undefined) where.push(gt(account.startDate, filter.startDateAfter));
	if (filter.startDateBefore !== undefined)
		where.push(lt(account.startDate, filter.startDateBefore));
	if (filter.endDateAfter !== undefined) where.push(gt(account.endDate, filter.endDateAfter));
	if (filter.endDateBefore !== undefined) where.push(lt(account.endDate, filter.endDateBefore));
	if (filter.type !== undefined && filter.type.length > 0)
		where.push(inArray(account.type, filter.type));

	return where;
};

const accountIdToTitle = async (id: string) => {
	const foundAccount = await db
		.select({ title: account.title })
		.from(account)
		.where(eq(account.id, id))
		.limit(1)
		.execute();

	if (foundAccount?.length === 1) {
		return foundAccount[0].title;
	}
	return id;
};

export const accountIdsToTitle = async (ids: string[]) => {
	const titles = await Promise.all(ids.map(async (id) => accountIdToTitle(id)));

	return titles;
};

export const accountFilterToText = async (
	filter: Omit<AccountFilterSchemaType, 'page' | 'pageSize' | 'orderBy'>,
	{ prefix, allText = true }: { prefix?: string; allText?: boolean } = {}
) => {
	const restFilter = filter;

	const stringArray: string[] = [];
	if (restFilter.id) stringArray.push(`Is ${await accountIdToTitle(restFilter.id)}`);
	if (restFilter.idArray) {
		if (restFilter.idArray.length === 1) {
			stringArray.push(`Is ${await accountIdToTitle(restFilter.idArray[0])}`);
		} else {
			stringArray.push(`Is One Of ${(await accountIdsToTitle(restFilter.idArray)).join(',')}`);
		}
	}
	if (restFilter.title) stringArray.push(`Title contains ${restFilter.title}`);
	if (restFilter.accountGroup) stringArray.push(`Group contains ${restFilter.accountGroup}`);
	if (restFilter.accountGroup2) stringArray.push(`Group 2 contains ${restFilter.accountGroup2}`);
	if (restFilter.accountGroup3) stringArray.push(`Group 3 contains ${restFilter.accountGroup3}`);
	if (restFilter.accountGroupCombined)
		stringArray.push(`Group Combined contains ${restFilter.accountGroupCombined}`);
	if (restFilter.accountTitleCombined)
		stringArray.push(`Group Combined With Title contains ${restFilter.accountTitleCombined}`);
	if (restFilter.status) stringArray.push(`Status equals ${restFilter.status}`);
	//Not including text for not deleted as this doesn't really add much value.
	//else where.push(not(eq(budget.status, 'deleted')));
	if (restFilter.deleted) stringArray.push(`Is Deleted`);
	if (restFilter.disabled) stringArray.push(`Is Disabled`);
	if (restFilter.allowUpdate) stringArray.push(`Can Be Updated`);
	if (restFilter.active) stringArray.push(`Is Active`);
	if (restFilter.isCash !== undefined) stringArray.push(`Is ${restFilter.isCash ? '' : 'Not'}Cash`);
	if (restFilter.isNetWorth !== undefined)
		stringArray.push(`Is ${restFilter.isCash ? '' : 'Not'}Net Worth`);
	if (restFilter.startDateAfter !== undefined)
		stringArray.push(`Start Date Is After ${restFilter.startDateAfter}`);
	if (restFilter.startDateBefore !== undefined)
		stringArray.push(`Start Date Is Before ${restFilter.startDateBefore}`);
	if (restFilter.endDateAfter !== undefined)
		stringArray.push(`End Date Is After ${restFilter.endDateAfter}`);
	if (restFilter.endDateBefore !== undefined)
		stringArray.push(`End Date Is Before ${restFilter.endDateBefore}`);
	if (restFilter.type !== undefined && restFilter.type.length > 0) {
		if (restFilter.type.length === 1) {
			stringArray.push(`Type is ${restFilter.type[0]}`);
		} else if (restFilter.type.length < 4) {
			stringArray.push(`Type is one of ${restFilter.type.join(', ')}`);
		}
	}

	if (stringArray.length === 0 && allText) {
		stringArray.push('Showing All');
	}

	if (prefix) {
		return stringArray.map((item) => `${prefix} ${item}`);
	}

	return stringArray;
};
