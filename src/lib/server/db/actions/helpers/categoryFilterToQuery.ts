import type { CategoryFilterSchemaType } from '$lib/schema/categorySchema';
import { category } from '../../schema';
import { SQL, eq, ilike, like, not } from 'drizzle-orm';

export const categoryFilterToQuery = (
	filter: Omit<CategoryFilterSchemaType, 'page' | 'pageSize' | 'orderBy'>
) => {
	const restFilter = filter;

	const where: SQL<unknown>[] = [];
	if (restFilter.id) where.push(eq(category.id, restFilter.id));
	if (restFilter.title) where.push(like(category.title, `%${restFilter.title}%`));
	if (restFilter.group) where.push(ilike(category.title, `%${restFilter.group}%`));
	if (restFilter.single) where.push(ilike(category.title, `%${restFilter.single}%`));
	if (restFilter.status) where.push(eq(category.status, restFilter.status));
	else where.push(not(eq(category.status, 'deleted')));
	if (restFilter.deleted) where.push(eq(category.deleted, restFilter.deleted));
	if (restFilter.disabled) where.push(eq(category.disabled, restFilter.disabled));
	if (restFilter.allowUpdate) where.push(eq(category.allowUpdate, restFilter.allowUpdate));
	if (restFilter.active) where.push(eq(category.active, restFilter.active));

	return where;
};
