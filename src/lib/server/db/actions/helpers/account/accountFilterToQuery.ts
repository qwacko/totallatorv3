import type { AccountFilterSchemaType } from '$lib/schema/accountSchema';
import type { DBType } from '$lib/server/db/db';
import { account } from '$lib/server/db/postgres/schema';
import { SQL, eq, gt, inArray, ilike, lt } from 'drizzle-orm';
import { summaryFilterToQuery, summaryFilterToText } from '../summary/summaryFilterToQuery';
import { idTitleFilterToQuery, idTitleFilterToText } from '../misc/filterToQueryTitleIDCore';
import { statusFilterToQuery, statusFilterToText } from '../misc/filterToQueryStatusCore';
import { importFilterToQuery, importFilterToText } from '../misc/filterToQueryImportCore';
import { filterToQueryFinal } from '../misc/filterToQueryFinal';

export const accountFilterToQuery = (
	filter: Omit<AccountFilterSchemaType, 'pageNo' | 'pageSize' | 'orderBy'>,
	includeSummary: boolean = false
) => {
	const where: SQL<unknown>[] = [];
	idTitleFilterToQuery(where, filter, 'account');
	if (filter.accountGroup) where.push(ilike(account.accountGroup, `%${filter.accountGroup}%`));
	if (filter.accountGroup2) where.push(ilike(account.accountGroup2, `%${filter.accountGroup2}%`));
	if (filter.accountGroup3) where.push(ilike(account.accountGroup3, `%${filter.accountGroup3}%`));
	if (filter.accountGroupCombined)
		where.push(ilike(account.accountGroupCombined, `%${filter.accountGroupCombined}%`));
	if (filter.accountTitleCombined)
		where.push(ilike(account.accountTitleCombined, `%${filter.accountTitleCombined}%`));
	statusFilterToQuery(where, filter, 'account');
	if (filter.isCash !== undefined) where.push(eq(account.isCash, filter.isCash));
	if (filter.isNetWorth !== undefined) where.push(eq(account.isNetWorth, filter.isNetWorth));
	if (filter.startDateAfter !== undefined) where.push(gt(account.startDate, filter.startDateAfter));
	if (filter.startDateBefore !== undefined)
		where.push(lt(account.startDate, filter.startDateBefore));
	if (filter.endDateAfter !== undefined) where.push(gt(account.endDate, filter.endDateAfter));
	if (filter.endDateBefore !== undefined) where.push(lt(account.endDate, filter.endDateBefore));
	importFilterToQuery(where, filter, 'account');
	if (filter.type !== undefined && filter.type.length > 0)
		where.push(inArray(account.type, filter.type));

	if (includeSummary) {
		summaryFilterToQuery({ where, filter });
	}

	return where;
};

export const accountIdToTitle = async (db: DBType, id: string) => {
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

export const accountIdsToTitles = async (db: DBType, ids: string[]) => {
	const titles = await Promise.all(ids.map(async (id) => accountIdToTitle(db, id)));

	return titles;
};

export const accountFilterToText = async ({
	filter,
	prefix,
	allText = true,
	db
}: {
	filter: Omit<AccountFilterSchemaType, 'page' | 'pageSize' | 'orderBy'>;
	prefix?: string;
	allText?: boolean;
	db: DBType;
}) => {
	const restFilter = filter;

	const stringArray: string[] = [];
	await idTitleFilterToText(db, stringArray, filter, accountIdToTitle);
	if (restFilter.accountGroup) stringArray.push(`Group contains ${restFilter.accountGroup}`);
	if (restFilter.accountGroup2) stringArray.push(`Group 2 contains ${restFilter.accountGroup2}`);
	if (restFilter.accountGroup3) stringArray.push(`Group 3 contains ${restFilter.accountGroup3}`);
	if (restFilter.accountGroupCombined)
		stringArray.push(`Group Combined contains ${restFilter.accountGroupCombined}`);
	if (restFilter.accountTitleCombined)
		stringArray.push(`Group Combined With Title contains ${restFilter.accountTitleCombined}`);
	statusFilterToText(stringArray, filter);
	if (restFilter.isCash !== undefined) stringArray.push(`Is ${restFilter.isCash ? '' : 'Not'}Cash`);
	if (restFilter.isNetWorth !== undefined)
		stringArray.push(`Is ${restFilter.isNetWorth ? '' : 'Not'}Net Worth`);
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
	importFilterToText(db, stringArray, filter);
	summaryFilterToText({ stringArray, filter: restFilter });
	return filterToQueryFinal({ stringArray, allText, prefix });
};
