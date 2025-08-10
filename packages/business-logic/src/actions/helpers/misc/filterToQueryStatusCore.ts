import { budget, bill, category, tag, label, account } from '@totallator/database';
import { SQL, eq, type ColumnBaseConfig, not } from 'drizzle-orm';
import type { StatusEnumType } from '@totallator/shared';
import type { PgColumn } from 'drizzle-orm/pg-core';
import { inArrayWrapped } from './inArrayWrapped';

type FilterCoreType = {
	status?: StatusEnumType | undefined;
	statusArray?: StatusEnumType[];
	excludeStatusArray?: StatusEnumType[];
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
	if (restFilter.statusArray && restFilter.statusArray.length > 0)
		where.push(inArrayWrapped(statusColumn, restFilter.statusArray));
	if (restFilter.excludeStatusArray && restFilter.excludeStatusArray.length > 0)
		where.push(not(inArrayWrapped(statusColumn, restFilter.excludeStatusArray)));
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
	if (restFilter.statusArray && restFilter.statusArray.length > 0)
		where.push(inArrayWrapped(usedTable.status, restFilter.statusArray));
	if (restFilter.excludeStatusArray && restFilter.excludeStatusArray.length > 0)
		where.push(not(inArrayWrapped(usedTable.status, restFilter.excludeStatusArray)));
	if (restFilter.disabled !== undefined) where.push(eq(usedTable.disabled, restFilter.disabled));
	if (restFilter.allowUpdate !== undefined)
		where.push(eq(usedTable.allowUpdate, restFilter.allowUpdate));
	if (restFilter.active !== undefined) where.push(eq(usedTable.active, restFilter.active));

	return where;
};

export const statusFilterToText = async (stringArray: string[], filter: FilterCoreType) => {
	const restFilter = filter;

	if (restFilter.status) stringArray.push(`Status equals ${restFilter.status}`);
	if (restFilter.statusArray && restFilter.statusArray.length > 0)
		stringArray.push(`Status equals ${restFilter.statusArray.join(' or ')}`);
	if (restFilter.excludeStatusArray && restFilter.excludeStatusArray.length > 0)
		stringArray.push(`Status does not equal ${restFilter.excludeStatusArray.join(' or ')}`);
	if (restFilter.disabled !== undefined)
		stringArray.push(`Is ${restFilter.disabled ? '' : 'Not '}Disabled`);
	if (restFilter.allowUpdate !== undefined)
		stringArray.push(`Can${restFilter.allowUpdate ? '' : "'t"} Be Updated`);
	if (restFilter.active) stringArray.push(`Is ${restFilter.active ? '' : 'Not '}Active`);

	return stringArray;
};
