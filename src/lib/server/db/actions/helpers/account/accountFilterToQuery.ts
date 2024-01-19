import type { AccountFilterSchemaType } from '$lib/schema/accountSchema';
import type { DBType } from '$lib/server/db/db';
import { account } from '$lib/server/db/postgres/schema';
import {
	accountMaterializedView,
	journalExtendedView
} from '$lib/server/db/postgres/schema/materializedViewSchema';
import { SQL, eq, gt, inArray, ilike, lt } from 'drizzle-orm';
import {
	summaryFilterToQueryMaterialized,
	summaryFilterToText
} from '../summary/summaryFilterToQuery';
import { idTitleFilterToQueryMapped, idTitleFilterToText } from '../misc/filterToQueryTitleIDCore';
import { statusFilterToQueryMapped, statusFilterToText } from '../misc/filterToQueryStatusCore';
import {
	importFilterToQueryMaterialized,
	importFilterToText
} from '../misc/filterToQueryImportCore';
import { filterToQueryFinal } from '../misc/filterToQueryFinal';

export const accountFilterToQuery = ({
	filter,
	target
}: {
	filter: Omit<AccountFilterSchemaType, 'pageNo' | 'pageSize' | 'orderBy'>;

	target?: 'materializedJournals' | 'account' | 'accountWithSummary';
}) => {
	const where: SQL<unknown>[] = [];

	const materializedJournals = target === 'materializedJournals';
	const includeSummary = target === 'accountWithSummary';

	const selectedTable = materializedJournals
		? {
				id: journalExtendedView.accountId,
				title: journalExtendedView.accountTitle,
				accountGroup: journalExtendedView.accountGroup,
				accountGroup2: journalExtendedView.accountGroup2,
				accountGroup3: journalExtendedView.accountGroup3,
				accountGroupCombined: journalExtendedView.accountGroupCombined,
				accountTitleCombined: journalExtendedView.accountTitleCombined,
				startDate: journalExtendedView.accountStartDate,
				endDate: journalExtendedView.accountEndDate,
				type: journalExtendedView.accountType,
				isCash: journalExtendedView.accountIsCash,
				isNetWorth: journalExtendedView.accountIsNetWorth,
				status: journalExtendedView.accountStatus,
				disabled: journalExtendedView.accountDisabled,
				allowUpdate: journalExtendedView.accountAllowUpdate,
				active: journalExtendedView.accountActive
			}
		: accountMaterializedView;

	idTitleFilterToQueryMapped({
		where,
		filter,
		idColumn: selectedTable.id,
		titleColumn: selectedTable.title
	});
	if (filter.accountGroup)
		where.push(ilike(selectedTable.accountGroup, `%${filter.accountGroup}%`));
	if (filter.accountGroup2)
		where.push(ilike(selectedTable.accountGroup2, `%${filter.accountGroup2}%`));
	if (filter.accountGroup3)
		where.push(ilike(selectedTable.accountGroup3, `%${filter.accountGroup3}%`));
	if (filter.accountGroupCombined)
		where.push(ilike(selectedTable.accountGroupCombined, `%${filter.accountGroupCombined}%`));
	if (filter.accountTitleCombined)
		where.push(ilike(selectedTable.accountTitleCombined, `%${filter.accountTitleCombined}%`));
	statusFilterToQueryMapped({
		where,
		filter,
		statusColumn: selectedTable.status,
		disabledColumn: selectedTable.disabled,
		allowUpdateColumn: selectedTable.allowUpdate,
		activeColumn: selectedTable.active
	});
	if (filter.isCash !== undefined) where.push(eq(selectedTable.isCash, filter.isCash));
	if (filter.isNetWorth !== undefined) where.push(eq(selectedTable.isNetWorth, filter.isNetWorth));
	if (filter.startDateAfter !== undefined)
		where.push(gt(selectedTable.startDate, filter.startDateAfter));
	if (filter.startDateBefore !== undefined)
		where.push(lt(selectedTable.startDate, filter.startDateBefore));
	if (filter.endDateAfter !== undefined) where.push(gt(selectedTable.endDate, filter.endDateAfter));
	if (filter.endDateBefore !== undefined)
		where.push(lt(selectedTable.endDate, filter.endDateBefore));
	if (!materializedJournals) {
		importFilterToQueryMaterialized({
			where,
			filter,
			table: {
				importId: accountMaterializedView.importId,
				importDetailId: accountMaterializedView.importDetailId
			}
		});
	}
	if (filter.type !== undefined && filter.type.length > 0)
		where.push(inArray(selectedTable.type, filter.type));

	if (includeSummary) {
		summaryFilterToQueryMaterialized({
			filter,
			where,
			table: {
				count: accountMaterializedView.count,
				sum: accountMaterializedView.sum,
				firstDate: accountMaterializedView.firstDate,
				lastDate: accountMaterializedView.lastDate
			}
		});
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
	if (restFilter.isCash !== undefined)
		stringArray.push(`Is ${restFilter.isCash ? '' : 'Not '}Cash`);
	if (restFilter.isNetWorth !== undefined)
		stringArray.push(`Is ${restFilter.isNetWorth ? '' : 'Not '}Net Worth`);
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
