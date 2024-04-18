import type { AccountFilterSchemaWithoutPaginationType } from '$lib/schema/accountSchema';
import type { DBType } from '$lib/server/db/db';
import { account } from '$lib/server/db/postgres/schema';
import {
	accountMaterializedView,
	journalExtendedView
} from '$lib/server/db/postgres/schema/materializedViewSchema';
import { SQL, eq, gt, ilike, lt, not } from 'drizzle-orm';
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
import { ilikeArrayWrapped, inArrayWrapped } from '../misc/inArrayWrapped';
import { arrayToText } from '../misc/arrayToText';
import { processAccountTextFilter } from './accountTextFilter';
import { linkedFileFilterQuery, linkedFileFilterToText } from '../file/fileFilterToQuery';
import { linkedNoteFilterQuery, linkedNoteFilterToText } from '../note/noteFilterToQuery';

export const accountFilterToQuery = ({
	filter,
	target
}: {
	filter: AccountFilterSchemaWithoutPaginationType;
	target?: 'materializedJournals' | 'account' | 'accountWithSummary';
}) => {
	const where: SQL<unknown>[] = [];

	const intFilter = processAccountTextFilter.process(JSON.parse(JSON.stringify(filter)));

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
		filter: intFilter,
		idColumn: selectedTable.id,
		titleColumn: selectedTable.title
	});

	// Account Group
	if (intFilter.accountGroup)
		where.push(ilike(selectedTable.accountGroup, `%${intFilter.accountGroup}%`));
	if (intFilter.accountGroupArray && intFilter.accountGroupArray.length > 0) {
		where.push(ilikeArrayWrapped(selectedTable.accountGroup, intFilter.accountGroupArray));
	}
	if (intFilter.excludeAccountGroupArray && intFilter.excludeAccountGroupArray.length > 0) {
		where.push(
			not(ilikeArrayWrapped(selectedTable.accountGroup, intFilter.excludeAccountGroupArray))
		);
	}

	// Account Group 2
	if (intFilter.accountGroup2)
		where.push(ilike(selectedTable.accountGroup2, `%${intFilter.accountGroup2}%`));
	if (intFilter.accountGroup2Array && intFilter.accountGroup2Array.length > 0) {
		where.push(ilikeArrayWrapped(selectedTable.accountGroup2, intFilter.accountGroup2Array));
	}
	if (intFilter.excludeAccountGroup2Array && intFilter.excludeAccountGroup2Array.length > 0) {
		where.push(
			not(ilikeArrayWrapped(selectedTable.accountGroup2, intFilter.excludeAccountGroup2Array))
		);
	}

	// Account Group 3
	if (intFilter.accountGroup3)
		where.push(ilike(selectedTable.accountGroup3, `%${intFilter.accountGroup3}%`));
	if (intFilter.accountGroup3Array && intFilter.accountGroup3Array.length > 0) {
		where.push(ilikeArrayWrapped(selectedTable.accountGroup3, intFilter.accountGroup3Array));
	}
	if (intFilter.excludeAccountGroup3Array && intFilter.excludeAccountGroup3Array.length > 0) {
		where.push(
			not(ilikeArrayWrapped(selectedTable.accountGroup3, intFilter.excludeAccountGroup3Array))
		);
	}

	// Account Group Combined
	if (intFilter.accountGroupCombined)
		where.push(ilike(selectedTable.accountGroupCombined, `%${intFilter.accountGroupCombined}%`));
	if (intFilter.accountGroupCombinedArray && intFilter.accountGroupCombinedArray.length > 0) {
		where.push(
			ilikeArrayWrapped(selectedTable.accountGroupCombined, intFilter.accountGroupCombinedArray)
		);
	}
	if (
		intFilter.excludeAccountGroupCombinedArray &&
		intFilter.excludeAccountGroupCombinedArray.length > 0
	) {
		where.push(
			not(
				ilikeArrayWrapped(
					selectedTable.accountGroupCombined,
					intFilter.excludeAccountGroupCombinedArray
				)
			)
		);
	}

	// Account Title Combined
	if (intFilter.accountTitleCombined)
		where.push(ilike(selectedTable.accountTitleCombined, `%${intFilter.accountTitleCombined}%`));
	if (intFilter.accountTitleCombinedArray && intFilter.accountTitleCombinedArray.length > 0) {
		where.push(
			ilikeArrayWrapped(selectedTable.accountTitleCombined, intFilter.accountTitleCombinedArray)
		);
	}
	if (
		intFilter.excludeAccountTitleCombinedArray &&
		intFilter.excludeAccountTitleCombinedArray.length > 0
	) {
		where.push(
			not(
				ilikeArrayWrapped(
					selectedTable.accountTitleCombined,
					intFilter.excludeAccountTitleCombinedArray
				)
			)
		);
	}

	statusFilterToQueryMapped({
		where,
		filter: intFilter,
		statusColumn: selectedTable.status,
		disabledColumn: selectedTable.disabled,
		allowUpdateColumn: selectedTable.allowUpdate,
		activeColumn: selectedTable.active
	});
	if (intFilter.isCash !== undefined) where.push(eq(selectedTable.isCash, intFilter.isCash));
	if (intFilter.isNetWorth !== undefined)
		where.push(eq(selectedTable.isNetWorth, intFilter.isNetWorth));
	if (intFilter.startDateAfter !== undefined)
		where.push(gt(selectedTable.startDate, intFilter.startDateAfter));
	if (intFilter.startDateBefore !== undefined)
		where.push(lt(selectedTable.startDate, intFilter.startDateBefore));
	if (intFilter.endDateAfter !== undefined)
		where.push(gt(selectedTable.endDate, intFilter.endDateAfter));
	if (intFilter.endDateBefore !== undefined)
		where.push(lt(selectedTable.endDate, intFilter.endDateBefore));
	if (!materializedJournals) {
		importFilterToQueryMaterialized({
			where,
			filter: intFilter,
			table: {
				importId: accountMaterializedView.importId,
				importDetailId: accountMaterializedView.importDetailId
			}
		});
	}

	//Type
	if (intFilter.type !== undefined && intFilter.type.length > 0)
		where.push(inArrayWrapped(selectedTable.type, intFilter.type));
	if (intFilter.excludeType !== undefined && intFilter.excludeType.length > 0)
		where.push(not(inArrayWrapped(selectedTable.type, intFilter.excludeType)));

	if (includeSummary) {
		linkedFileFilterQuery({
			where,
			filter: intFilter,
			fileCountColumn: accountMaterializedView.fileCount
		});
		linkedNoteFilterQuery({
			where,
			filter: intFilter,
			noteCountColumn: accountMaterializedView.noteCount,
			reminderCountColumn: accountMaterializedView.reminderCount
		});
		summaryFilterToQueryMaterialized({
			filter: intFilter,
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
	filter: AccountFilterSchemaWithoutPaginationType;
	prefix?: string;
	allText?: boolean;
	db: DBType;
}) => {
	const restFilter = processAccountTextFilter.process(JSON.parse(JSON.stringify(filter)));

	const stringArray: string[] = [];
	await idTitleFilterToText(db, stringArray, restFilter, accountIdToTitle);

	// Account Group
	if (restFilter.accountGroup) stringArray.push(`Group contains ${restFilter.accountGroup}`);
	if (restFilter.accountGroupArray && restFilter.accountGroupArray.length > 0) {
		stringArray.push(
			await arrayToText({
				data: restFilter.accountGroupArray,
				singularName: 'Group',
				midText: 'contains'
			})
		);
	}
	if (restFilter.excludeAccountGroupArray && restFilter.excludeAccountGroupArray.length > 0) {
		stringArray.push(
			await arrayToText({
				data: restFilter.excludeAccountGroupArray,
				singularName: 'Group',
				midText: 'does not contain'
			})
		);
	}

	// Account Group 2
	if (restFilter.accountGroup2) stringArray.push(`Group 2 contains ${restFilter.accountGroup2}`);
	if (restFilter.accountGroup2Array && restFilter.accountGroup2Array.length > 0) {
		stringArray.push(
			await arrayToText({
				data: restFilter.accountGroup2Array,
				singularName: 'Group 2',
				midText: 'contains'
			})
		);
	}
	if (restFilter.excludeAccountGroup2Array && restFilter.excludeAccountGroup2Array.length > 0) {
		stringArray.push(
			await arrayToText({
				data: restFilter.excludeAccountGroup2Array,
				singularName: 'Group 2',
				midText: 'does not contain'
			})
		);
	}

	// Account Group 3
	if (restFilter.accountGroup3) stringArray.push(`Group 3 contains ${restFilter.accountGroup3}`);
	if (restFilter.accountGroup3Array && restFilter.accountGroup3Array.length > 0) {
		stringArray.push(
			await arrayToText({
				data: restFilter.accountGroup3Array,
				singularName: 'Group 3',
				midText: 'contains'
			})
		);
	}
	if (restFilter.excludeAccountGroup3Array && restFilter.excludeAccountGroup3Array.length > 0) {
		stringArray.push(
			await arrayToText({
				data: restFilter.excludeAccountGroup3Array,
				singularName: 'Group 3',
				midText: 'does not contain'
			})
		);
	}

	// Account Group Combined
	if (restFilter.accountGroupCombined)
		stringArray.push(`Group Combined contains ${restFilter.accountGroupCombined}`);
	if (restFilter.accountGroupCombinedArray && restFilter.accountGroupCombinedArray.length > 0) {
		stringArray.push(
			await arrayToText({
				data: restFilter.accountGroupCombinedArray,
				singularName: 'Group Combined',
				midText: 'contains'
			})
		);
	}
	if (
		restFilter.excludeAccountGroupCombinedArray &&
		restFilter.excludeAccountGroupCombinedArray.length > 0
	) {
		stringArray.push(
			await arrayToText({
				data: restFilter.excludeAccountGroupCombinedArray,
				singularName: 'Group Combined',
				midText: 'does not contain'
			})
		);
	}

	// Account Title Combined
	if (restFilter.accountTitleCombined)
		stringArray.push(`Group Combined With Title contains ${restFilter.accountTitleCombined}`);
	if (restFilter.accountTitleCombinedArray && restFilter.accountTitleCombinedArray.length > 0) {
		stringArray.push(
			await arrayToText({
				data: restFilter.accountTitleCombinedArray,
				singularName: 'Group Combined With Title',
				midText: 'contains'
			})
		);
	}
	if (
		restFilter.excludeAccountTitleCombinedArray &&
		restFilter.excludeAccountTitleCombinedArray.length > 0
	) {
		stringArray.push(
			await arrayToText({
				data: restFilter.excludeAccountTitleCombinedArray,
				singularName: 'Group Combined With Title',
				midText: 'does not contain'
			})
		);
	}

	// Status FIlters
	statusFilterToText(stringArray, restFilter);

	// Boolean Filters
	if (restFilter.isCash !== undefined)
		stringArray.push(`Is ${restFilter.isCash ? '' : 'Not '}Cash`);
	if (restFilter.isNetWorth !== undefined)
		stringArray.push(`Is ${restFilter.isNetWorth ? '' : 'Not '}Net Worth`);

	// Date Filters
	if (restFilter.startDateAfter !== undefined)
		stringArray.push(`Start Date Is After ${restFilter.startDateAfter}`);
	if (restFilter.startDateBefore !== undefined)
		stringArray.push(`Start Date Is Before ${restFilter.startDateBefore}`);
	if (restFilter.endDateAfter !== undefined)
		stringArray.push(`End Date Is After ${restFilter.endDateAfter}`);
	if (restFilter.endDateBefore !== undefined)
		stringArray.push(`End Date Is Before ${restFilter.endDateBefore}`);

	// Type Filter
	if (restFilter.type !== undefined && restFilter.type.length > 0) {
		stringArray.push(
			await arrayToText({
				data: restFilter.type,
				singularName: 'Type'
			})
		);
	}
	if (restFilter.excludeType !== undefined && restFilter.excludeType.length > 0) {
		stringArray.push(
			await arrayToText({
				data: restFilter.excludeType,
				singularName: 'Type',
				midText: 'is not'
			})
		);
	}

	linkedFileFilterToText(restFilter, stringArray);
	linkedNoteFilterToText(restFilter, stringArray);
	importFilterToText(db, stringArray, restFilter);
	summaryFilterToText({ stringArray, filter: restFilter });
	return filterToQueryFinal({ stringArray, allText, prefix });
};
