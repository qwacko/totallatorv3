import { category, bill, budget, tag, label, account } from '../../../postgres/schema';
import { SQL, not, type ColumnBaseConfig } from 'drizzle-orm';
import { arrayToText } from './arrayToText';
import { importIdsToTitles } from '../import/importIdsToTitles';
import type { DBType } from '$lib/server/db/db';
import type { PgColumn } from 'drizzle-orm/pg-core';
import { inArrayWrapped } from './inArrayWrapped';

type FilterCoreType = {
	importIdArray?: string[];
	excludeImportIDArray?: string[];
	importDetailIdArray?: string[];
	excludeImportDetailIdArray?: string[];
};

export const importFilterToQuery = (
	where: SQL<unknown>[],
	filter: FilterCoreType,
	type: 'bill' | 'budget' | 'category' | 'tag' | 'label' | 'account'
) => {
	const restFilter = filter;

	const usedTable =
		type === 'category'
			? category
			: type === 'bill'
				? bill
				: type === 'budget'
					? budget
					: type === 'tag'
						? tag
						: type === 'label'
							? label
							: account;

	if (restFilter.importIdArray && restFilter.importIdArray.length > 0)
		where.push(inArrayWrapped(usedTable.importId, restFilter.importIdArray));
	if (restFilter.excludeImportIDArray && restFilter.excludeImportIDArray.length > 0)
		where.push(not(inArrayWrapped(usedTable.importId, restFilter.excludeImportIDArray)));
	if (restFilter.importDetailIdArray && restFilter.importDetailIdArray.length > 0)
		where.push(inArrayWrapped(usedTable.importDetailId, restFilter.importDetailIdArray));
	if (restFilter.excludeImportDetailIdArray && restFilter.excludeImportDetailIdArray.length > 0)
		where.push(
			not(inArrayWrapped(usedTable.importDetailId, restFilter.excludeImportDetailIdArray))
		);

	return where;
};

export const importFilterToQueryMaterialized = ({
	where,
	filter,
	table
}: {
	where: SQL<unknown>[];
	filter: FilterCoreType;
	table: {
		importId: PgColumn<ColumnBaseConfig<'string', string>>;
		importDetailId: PgColumn<ColumnBaseConfig<'string', string>>;
	};
}) => {
	const restFilter = filter;

	if (restFilter.importIdArray && restFilter.importIdArray.length > 0)
		where.push(inArrayWrapped(table.importId, restFilter.importIdArray));
	if (restFilter.excludeImportIDArray && restFilter.excludeImportIDArray.length > 0)
		where.push(not(inArrayWrapped(table.importId, restFilter.excludeImportIDArray)));
	if (restFilter.importDetailIdArray && restFilter.importDetailIdArray.length > 0)
		where.push(inArrayWrapped(table.importDetailId, restFilter.importDetailIdArray));
	if (restFilter.excludeImportDetailIdArray && restFilter.excludeImportDetailIdArray.length > 0)
		where.push(not(inArrayWrapped(table.importDetailId, restFilter.excludeImportDetailIdArray)));

	return where;
};

export const importFilterToText = async (
	db: DBType,
	stringArray: string[],
	filter: FilterCoreType
) => {
	const restFilter = filter;

	if (restFilter.importIdArray && restFilter.importIdArray.length > 0)
		stringArray.push(
			await arrayToText({
				data: restFilter.importIdArray,
				singularName: 'Import',
				inputToText: (title) => importIdsToTitles(db, title)
			})
		);
	if (restFilter.excludeImportIDArray && restFilter.excludeImportIDArray.length > 0)
		stringArray.push(
			await arrayToText({
				data: restFilter.excludeImportIDArray,
				singularName: 'Import',
				inputToText: (title) => importIdsToTitles(db, title),
				midText: 'is not'
			})
		);
	if (restFilter.importDetailIdArray && restFilter.importDetailIdArray.length > 0)
		stringArray.push(
			await arrayToText({
				data: restFilter.importDetailIdArray,
				singularName: 'Import Detail ID'
			})
		);
	if (restFilter.excludeImportDetailIdArray && restFilter.excludeImportDetailIdArray.length > 0)
		stringArray.push(
			await arrayToText({
				data: restFilter.excludeImportDetailIdArray,
				singularName: 'Import Detail ID',
				midText: 'is not'
			})
		);

	return stringArray;
};
