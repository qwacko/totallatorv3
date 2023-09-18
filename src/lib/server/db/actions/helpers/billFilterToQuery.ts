import type { BillFilterSchemaType } from '$lib/schema/billSchema';
import { bill } from '../../schema';
import { SQL, eq, like, not } from 'drizzle-orm';

export const billFilterToQuery = (
	filter: Omit<BillFilterSchemaType, 'page' | 'pageSize' | 'orderBy'>
) => {
	const restFilter = filter;

	const where: SQL<unknown>[] = [];
	if (restFilter.id) where.push(eq(bill.id, restFilter.id));
	if (restFilter.title) where.push(like(bill.title, `%${restFilter.title}%`));
	if (restFilter.status) where.push(eq(bill.status, restFilter.status));
	else where.push(not(eq(bill.status, 'deleted')));
	if (restFilter.deleted) where.push(eq(bill.deleted, restFilter.deleted));
	if (restFilter.disabled) where.push(eq(bill.disabled, restFilter.disabled));
	if (restFilter.allowUpdate) where.push(eq(bill.allowUpdate, restFilter.allowUpdate));
	if (restFilter.active) where.push(eq(bill.active, restFilter.active));

	return where;
};
