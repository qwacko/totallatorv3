import { budget, bill, category, tag, label, account } from '../../../postgres/schema';
import { SQL, eq, type ColumnBaseConfig } from 'drizzle-orm';
import type { StatusEnumType } from '$lib/schema/statusSchema';
import type { PgColumn } from 'drizzle-orm/pg-core';

type FilterCoreType = {
	status?: StatusEnumType | undefined;
	disabled?: boolean | undefined;
	allowUpdate?: boolean | undefined;
	active?: boolean | undefined;
};

export const statusFilterToQueryMapped = ({
	where,
	filter,
	statusColumn,
	disabledColumn,
	allowUpdateColumn,
	activeColumn
}: {
	where: SQL<unknown>[];
	filter: FilterCoreType;
	statusColumn: PgColumn<ColumnBaseConfig<'string', string>>;
	disabledColumn: PgColumn<ColumnBaseConfig<'boolean', string>>;
	allowUpdateColumn: PgColumn<ColumnBaseConfig<'boolean', string>>;
	activeColumn: PgColumn<ColumnBaseConfig<'boolean', string>>;
}) => {
	const restFilter = filter;

	if (restFilter.status) where.push(eq(statusColumn, restFilter.status));
	if (restFilter.disabled !== undefined) where.push(eq(disabledColumn, restFilter.disabled));
	if (restFilter.allowUpdate !== undefined)
		where.push(eq(allowUpdateColumn, restFilter.allowUpdate));
	if (restFilter.active !== undefined) where.push(eq(activeColumn, restFilter.active));

	return where;
};

export const statusFilterToQuery = (
	where: SQL<unknown>[],
	filter: FilterCoreType,
	type: 'bill' | 'budget' | 'category' | 'tag' | 'label' | 'account'
) => {
	const restFilter = filter;

	const usedTable =
		type === 'bill'
			? bill
			: type === 'budget'
				? budget
				: type === 'category'
					? category
					: type === 'tag'
						? tag
						: type === 'label'
							? label
							: account;

	if (restFilter.status) where.push(eq(usedTable.status, restFilter.status));
	if (restFilter.disabled !== undefined) where.push(eq(usedTable.disabled, restFilter.disabled));
	if (restFilter.allowUpdate !== undefined)
		where.push(eq(usedTable.allowUpdate, restFilter.allowUpdate));
	if (restFilter.active !== undefined) where.push(eq(usedTable.active, restFilter.active));

	return where;
};

export const statusFilterToText = async (stringArray: string[], filter: FilterCoreType) => {
	const restFilter = filter;

	if (restFilter.status) stringArray.push(`Status equals ${restFilter.status}`);
	if (restFilter.disabled !== undefined)
		stringArray.push(`Is ${restFilter.disabled ? '' : 'Not '}Disabled`);
	if (restFilter.allowUpdate !== undefined)
		stringArray.push(`Can${restFilter.allowUpdate ? '' : "'t"} Be Updated`);
	if (restFilter.active) stringArray.push(`Is ${restFilter.active ? '' : 'Not '}Active`);

	return stringArray;
};
