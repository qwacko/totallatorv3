import type { TagFilterSchemaType } from '$lib/schema/tagSchema';
import { tag } from '../../schema';
import { SQL, eq, ilike, like, not } from 'drizzle-orm';

export const tagFilterToQuery = (
	filter: Omit<TagFilterSchemaType, 'page' | 'pageSize' | 'orderBy'>
) => {
	const restFilter = filter;

	const where: SQL<unknown>[] = [];
	if (restFilter.id) where.push(eq(tag.id, restFilter.id));
	if (restFilter.title) where.push(like(tag.title, `%${restFilter.title}%`));
	if (restFilter.group) where.push(ilike(tag.title, `%${restFilter.group}%`));
	if (restFilter.single) where.push(ilike(tag.title, `%${restFilter.single}%`));
	if (restFilter.status) where.push(eq(tag.status, restFilter.status));
	else where.push(not(eq(tag.status, 'deleted')));
	if (restFilter.deleted) where.push(eq(tag.deleted, restFilter.deleted));
	if (restFilter.disabled) where.push(eq(tag.disabled, restFilter.disabled));
	if (restFilter.allowUpdate) where.push(eq(tag.allowUpdate, restFilter.allowUpdate));
	if (restFilter.active) where.push(eq(tag.active, restFilter.active));

	return where;
};
