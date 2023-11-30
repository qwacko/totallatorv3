import type { BudgetFilterSchemaType } from '$lib/schema/budgetSchema';
import { db } from '../../../db';
import { budget } from '../../../schema';
import { SQL, eq, inArray, like } from 'drizzle-orm';
import { arrayToText } from '../arrayToText';
import { importIdsToTitles } from '../importIdsToTitles';
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
	if (restFilter.disabled) where.push(eq(budget.disabled, restFilter.disabled));
	if (restFilter.allowUpdate) where.push(eq(budget.allowUpdate, restFilter.allowUpdate));
	if (restFilter.active) where.push(eq(budget.active, restFilter.active));
	if (restFilter.importIdArray && restFilter.importIdArray.length > 0)
		where.push(inArray(budget.importId, restFilter.importIdArray));
	if (restFilter.importDetailIdArray && restFilter.importDetailIdArray.length > 0)
		where.push(inArray(budget.importDetailId, restFilter.importDetailIdArray));

	if (includeSummary) {
		summaryFilterToQuery({ where, filter: restFilter });
	}

	return where;
};

export const budgetIdToTitle = async (id: string) => {
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

const budgetIdsToTitle = async (ids: string[]) => {
	const titles = await Promise.all(ids.map(async (id) => budgetIdToTitle(id)));

	return titles;
};

export const budgetFilterToText = async (
	filter: Omit<BudgetFilterSchemaType, 'page' | 'pageSize' | 'orderBy'>,

	{ prefix, allText = true }: { prefix?: string; allText?: boolean } = {}
) => {
	const restFilter = filter;

	const stringArray: string[] = [];
	if (restFilter.id) stringArray.push(`Is ${await budgetIdToTitle(restFilter.id)}`);
	if (restFilter.idArray && restFilter.idArray.length > 0) {
		if (restFilter.idArray.length === 1) {
			stringArray.push(`Is ${await budgetIdToTitle(restFilter.idArray[0])}`);
		} else {
			stringArray.push(`Is One Of ${(await budgetIdsToTitle(restFilter.idArray)).join(',')}`);
		}
	}
	if (restFilter.title) stringArray.push(`Title contains ${restFilter.title}`);
	if (restFilter.status) stringArray.push(`Status equals ${restFilter.status}`);
	if (restFilter.disabled) stringArray.push(`Is Disabled`);
	if (restFilter.allowUpdate) stringArray.push(`Can Be Updated`);
	if (restFilter.active) stringArray.push(`Is Active`);
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
