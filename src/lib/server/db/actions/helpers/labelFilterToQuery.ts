import type { LabelFilterSchemaType } from '$lib/schema/labelSchema';
import { label } from '../../schema';
import { SQL, eq, like, not } from 'drizzle-orm';

export const labelFilterToQuery = (filter: LabelFilterSchemaType) => {
	const where: SQL<unknown>[] = [];
	if (filter.id) where.push(eq(label.id, filter.id));
	if (filter.title) where.push(like(label.title, `%${filter.title}%`));
	if (filter.status) where.push(eq(label.status, filter.status));
	else where.push(not(eq(label.status, 'deleted')));
	if (filter.deleted) where.push(eq(label.deleted, filter.deleted));
	if (filter.disabled) where.push(eq(label.disabled, filter.disabled));
	if (filter.allowUpdate) where.push(eq(label.allowUpdate, filter.allowUpdate));
	if (filter.active) where.push(eq(label.active, filter.active));

	return where;
};
