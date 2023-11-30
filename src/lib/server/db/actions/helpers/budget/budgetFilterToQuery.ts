import type { BudgetFilterSchemaType } from '$lib/schema/budgetSchema';
import type { DBType } from '../../../db';
import { budget } from '../../../schema';
import { SQL, eq, inArray, like } from 'drizzle-orm';
import { arrayToText } from '../misc/arrayToText';
import { importIdsToTitles } from '../import/importIdsToTitles';
import { summaryFilterToQuery, summaryFilterToText } from '../summary/summaryFilterToQuery';

export const budgetFilterToQuery = (
	filter: Omit<BudgetFilterSchemaType, 'page' | 'pageSize' | 'orderBy'>,
	includeSummary: boolean = false
) => {
	const restFilter = filter;

	const where: SQL<unknown>[] = [];
	if (restFilter.id) where.push(eq(budget.id, restFilter.id));
	if (restFilter.idArray && restFilter.idArray.length > 0)
		where.push(inArray(budget.id, restFilter.idArray));
	if (restFilter.title) where.push(like(budget.title, `%${restFilter.title}%`));
	if (restFilter.status) where.push(eq(budget.status, restFilter.status));
	if (restFilter.disabled !== undefined) where.push(eq(budget.disabled, restFilter.disabled));
	if (restFilter.allowUpdate !== undefined)
		where.push(eq(budget.allowUpdate, restFilter.allowUpdate));
	if (restFilter.active !== undefined) where.push(eq(budget.active, restFilter.active));
	if (restFilter.importIdArray && restFilter.importIdArray.length > 0)
		where.push(inArray(budget.importId, restFilter.importIdArray));
	if (restFilter.importDetailIdArray && restFilter.importDetailIdArray.length > 0)
		where.push(inArray(budget.importDetailId, restFilter.importDetailIdArray));

	if (includeSummary) {
		summaryFilterToQuery({ where, filter: restFilter });
	}

	return where;
};

export const budgetIdToTitle = async (db: DBType, id: string) => {
	const foundBudget = await db
		.select({ title: budget.title })
		.from(budget)
		.where(eq(budget.id, id))
		.limit(1)
		.execute();

	if (foundBudget?.length === 1) {
		return foundBudget[0].title;
	}
	return id;
};

const budgetIdsToTitle = async (db: DBType, ids: string[]) => {
	const titles = await Promise.all(ids.map(async (id) => budgetIdToTitle(db, id)));

	return titles;
};

export const budgetFilterToText = async ({
	filter,
	db,
	prefix,
	allText = true
}: {
	db: DBType;
	filter: Omit<BudgetFilterSchemaType, 'page' | 'pageSize' | 'orderBy'>;
	prefix?: string;
	allText?: boolean;
}) => {
	const restFilter = filter;

	const stringArray: string[] = [];
	if (restFilter.id) stringArray.push(`Is ${await budgetIdToTitle(db, restFilter.id)}`);
	if (restFilter.idArray && restFilter.idArray.length > 0) {
		stringArray.push(
			await arrayToText({
				data: restFilter.idArray,
				inputToText: (titles) => budgetIdsToTitle(db, titles)
			})
		);
	}
	if (restFilter.title) stringArray.push(`Title contains ${restFilter.title}`);
	if (restFilter.status) stringArray.push(`Status equals ${restFilter.status}`);
	if (restFilter.disabled !== undefined)
		stringArray.push(`Is ${restFilter.disabled ? '' : 'Not '}Disabled`);
	if (restFilter.allowUpdate !== undefined)
		stringArray.push(`Can${restFilter.allowUpdate ? '' : "'t"} Be Updated`);
	if (restFilter.active) stringArray.push(`Is ${restFilter.active ? '' : 'Not '}Active`);
	if (restFilter.importIdArray && restFilter.importIdArray.length > 0)
		stringArray.push(
			await arrayToText({
				data: restFilter.importIdArray,
				singularName: 'Import',
				inputToText: importIdsToTitles
			})
		);
	if (restFilter.importDetailIdArray && restFilter.importDetailIdArray.length > 0)
		stringArray.push(
			await arrayToText({
				data: restFilter.importDetailIdArray,
				singularName: 'Import Detail ID'
			})
		);

	summaryFilterToText({ stringArray, filter: restFilter });

	if (stringArray.length === 0 && allText) {
		stringArray.push('Showing All');
	}

	if (prefix) {
		return stringArray.map((item) => `${prefix} ${item}`);
	}

	return stringArray;
};
