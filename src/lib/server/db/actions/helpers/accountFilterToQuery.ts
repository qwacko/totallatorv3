import type { AccountFilterSchemaType } from '$lib/schema/accountSchema';
import { account } from '../../schema';
import { SQL, eq, gt, inArray, like, not } from 'drizzle-orm';

export const accountFilterToQuery = (
	filter: Omit<AccountFilterSchemaType, 'pageNo' | 'pageSize' | 'orderBy'>
) => {
	const where: SQL<unknown>[] = [];
	if (filter.id) where.push(eq(account.id, filter.id));
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
		where.push(gt(account.startDate, filter.startDateBefore));
	if (filter.endDateAfter !== undefined) where.push(gt(account.endDate, filter.endDateAfter));
	if (filter.endDateBefore !== undefined) where.push(gt(account.endDate, filter.endDateBefore));
	if (filter.type !== undefined) where.push(inArray(account.type, filter.type));

	return where;
};
