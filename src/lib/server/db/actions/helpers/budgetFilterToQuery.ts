import type { BudgetFilterSchemaType } from '$lib/schema/budgetSchema';
import { budget } from '../../schema';
import { SQL, eq, like, not } from 'drizzle-orm';

export const budgetFilterToQuery = (
	filter: Omit<BudgetFilterSchemaType, 'page' | 'pageSize' | 'orderBy'>
) => {
	const restFilter = filter;

	const where: SQL<unknown>[] = [];
	if (restFilter.id) where.push(eq(budget.id, restFilter.id));
	if (restFilter.title) where.push(like(budget.title, `%${restFilter.title}%`));
	if (restFilter.status) where.push(eq(budget.status, restFilter.status));
	else where.push(not(eq(budget.status, 'deleted')));
	if (restFilter.deleted) where.push(eq(budget.deleted, restFilter.deleted));
	if (restFilter.disabled) where.push(eq(budget.disabled, restFilter.disabled));
	if (restFilter.allowUpdate) where.push(eq(budget.allowUpdate, restFilter.allowUpdate));
	if (restFilter.active) where.push(eq(budget.active, restFilter.active));

	return where;
};
