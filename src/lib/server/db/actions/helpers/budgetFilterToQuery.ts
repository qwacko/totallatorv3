import type { BudgetFilterSchemaType } from '$lib/schema/budgetSchema';
import { db } from '../../db';
import { budget } from '../../schema';
import { SQL, eq, inArray, like, not } from 'drizzle-orm';

export const budgetFilterToQuery = (
	filter: Omit<BudgetFilterSchemaType, 'page' | 'pageSize' | 'orderBy'>
) => {
	const restFilter = filter;

	const where: SQL<unknown>[] = [];
	if (restFilter.id) where.push(eq(budget.id, restFilter.id));
	if (restFilter.idArray) where.push(inArray(budget.id, restFilter.idArray));
	if (restFilter.title) where.push(like(budget.title, `%${restFilter.title}%`));
	if (restFilter.status) where.push(eq(budget.status, restFilter.status));
	else where.push(not(eq(budget.status, 'deleted')));
	if (restFilter.deleted) where.push(eq(budget.deleted, restFilter.deleted));
	if (restFilter.disabled) where.push(eq(budget.disabled, restFilter.disabled));
	if (restFilter.allowUpdate) where.push(eq(budget.allowUpdate, restFilter.allowUpdate));
	if (restFilter.active) where.push(eq(budget.active, restFilter.active));

	return where;
};

const budgetIdToTitle = async (id: string) => {
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
	prefix?: string
) => {
	const restFilter = filter;

	const stringArray: string[] = [];
	if (restFilter.id) stringArray.push(`Is ${await budgetIdToTitle(restFilter.id)}`);
	if (restFilter.idArray) {
		if (restFilter.idArray.length === 1) {
			stringArray.push(`Is ${await budgetIdToTitle(restFilter.idArray[0])}`);
		} else {
			stringArray.push(`Is One Of ${(await budgetIdsToTitle(restFilter.idArray)).join(',')}`);
		}
	}
	if (restFilter.title) stringArray.push(`Title contains ${restFilter.title}`);
	if (restFilter.status) stringArray.push(`Status equals ${restFilter.status}`);
	//Not including text for not deleted as this doesn't really add much value.
	//else where.push(not(eq(budget.status, 'deleted')));
	if (restFilter.deleted) stringArray.push(`Is Deleted`);
	if (restFilter.disabled) stringArray.push(`Is Disabled`);
	if (restFilter.allowUpdate) stringArray.push(`Can Be Updated`);
	if (restFilter.active) stringArray.push(`Is Active`);

	if (stringArray.length === 0) {
		stringArray.push('Showing All');
	}

	if (prefix) {
		return stringArray.map((item) => `${prefix} ${item}`);
	}

	return stringArray;
};
