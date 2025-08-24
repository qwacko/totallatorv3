import { type ColumnBaseConfig, eq, ilike, not, SQL } from 'drizzle-orm';
import type { PgColumn } from 'drizzle-orm/pg-core';

import type { DBType } from '@totallator/database';

import { arrayToText } from './arrayToText';
import { ilikeArrayWrapped, inArrayWrapped } from './inArrayWrapped';

type FilterCoreType = {
	id?: string;
	idArray?: string[];
	excludeIdArray?: string[];
	title?: string;
	titleArray?: string[];
	excludeTitleArray?: string[];
	group?: string;
	groupArray?: string[];
	excludeGroupArray?: string[];
	single?: string;
	singleArray?: string[];
	excludeSingleArray?: string[];
};

export const idTitleFilterToQueryMapped = ({
	where,
	filter,
	idColumn,
	titleColumn,
	groupColumn,
	singleColumn
}: {
	where: SQL<unknown>[];
	filter: FilterCoreType;
	idColumn: PgColumn<ColumnBaseConfig<'string', string>>;
	titleColumn: PgColumn<ColumnBaseConfig<'string', string>>;
	groupColumn?: PgColumn<ColumnBaseConfig<'string', string>>;
	singleColumn?: PgColumn<ColumnBaseConfig<'string', string>>;
}) => {
	const restFilter = filter;

	// ID
	if (restFilter.id) where.push(eq(idColumn, restFilter.id));
	if (restFilter.idArray && restFilter.idArray.length > 0)
		where.push(inArrayWrapped(idColumn, restFilter.idArray));
	if (restFilter.excludeIdArray && restFilter.excludeIdArray.length > 0)
		where.push(not(inArrayWrapped(idColumn, restFilter.excludeIdArray)));

	//Title
	if (restFilter.title) where.push(ilike(titleColumn, `%${restFilter.title}%`));
	if (restFilter.titleArray && restFilter.titleArray.length > 0)
		where.push(ilikeArrayWrapped(titleColumn, restFilter.titleArray));
	if (restFilter.excludeTitleArray && restFilter.excludeTitleArray.length > 0)
		where.push(not(ilikeArrayWrapped(titleColumn, restFilter.excludeTitleArray)));

	// Group
	if (groupColumn) {
		if (restFilter.group) where.push(ilike(groupColumn, `%${restFilter.group}%`));
		if (restFilter.groupArray && restFilter.groupArray.length > 0)
			where.push(ilikeArrayWrapped(groupColumn, restFilter.groupArray));
		if (restFilter.excludeGroupArray && restFilter.excludeGroupArray.length > 0)
			where.push(not(ilikeArrayWrapped(groupColumn, restFilter.excludeGroupArray)));
	}

	// Single
	if (singleColumn) {
		if (restFilter.single) {
			where.push(ilike(singleColumn, `%${restFilter.single}%`));
		}
		if (restFilter.singleArray && restFilter.singleArray.length > 0) {
			where.push(ilikeArrayWrapped(singleColumn, restFilter.singleArray));
		}
		if (restFilter.excludeSingleArray && restFilter.excludeSingleArray.length > 0) {
			where.push(not(ilikeArrayWrapped(singleColumn, restFilter.excludeSingleArray)));
		}
	}

	return where;
};

export const idTitleFilterToText = async (
	db: DBType,
	stringArray: string[],
	filter: FilterCoreType,
	idToTitle: (db: DBType, title: string) => Promise<string>
) => {
	const restFilter = filter;

	const idsToTitles = async (ids: string[]) => {
		return Promise.all(ids.map((id) => idToTitle(db, id)));
	};

	// ID
	if (restFilter.id) stringArray.push(`Is ${await idToTitle(db, restFilter.id)}`);
	if (restFilter.idArray && restFilter.idArray.length > 0) {
		stringArray.push(
			await arrayToText({
				data: restFilter.idArray,
				inputToText: idsToTitles
			})
		);
	}
	if (restFilter.excludeIdArray && restFilter.excludeIdArray.length > 0) {
		stringArray.push(
			await arrayToText({
				data: restFilter.excludeIdArray,
				inputToText: idsToTitles
			})
		);
	}

	// Title
	if (restFilter.title) stringArray.push(`Title contains ${restFilter.title}`);
	if (restFilter.titleArray && restFilter.titleArray.length > 0) {
		stringArray.push(
			await arrayToText({
				data: restFilter.titleArray,
				singularName: 'Title',
				midText: 'contains'
			})
		);
	}
	if (restFilter.excludeTitleArray && restFilter.excludeTitleArray.length > 0) {
		stringArray.push(
			await arrayToText({
				data: restFilter.excludeTitleArray,
				singularName: 'Title',
				midText: 'does not contain'
			})
		);
	}

	// Group
	if (restFilter.group) stringArray.push(`Group contains ${restFilter.group}`);
	if (restFilter.groupArray && restFilter.groupArray.length > 0) {
		stringArray.push(
			await arrayToText({
				data: restFilter.groupArray,
				singularName: 'Group',
				midText: 'contains'
			})
		);
	}
	if (restFilter.excludeGroupArray && restFilter.excludeGroupArray.length > 0) {
		stringArray.push(
			await arrayToText({
				data: restFilter.excludeGroupArray,
				singularName: 'Group',
				midText: 'does not contain'
			})
		);
	}

	// Single
	if (restFilter.single) stringArray.push(`Single contains ${restFilter.single}`);
	if (restFilter.singleArray && restFilter.singleArray.length > 0) {
		stringArray.push(
			await arrayToText({
				data: restFilter.singleArray,
				singularName: 'Single',
				midText: 'contains'
			})
		);
	}
	if (restFilter.excludeSingleArray && restFilter.excludeSingleArray.length > 0) {
		stringArray.push(
			await arrayToText({
				data: restFilter.excludeSingleArray,
				singularName: 'Single',
				midText: 'does not contain'
			})
		);
	}

	return stringArray;
};
