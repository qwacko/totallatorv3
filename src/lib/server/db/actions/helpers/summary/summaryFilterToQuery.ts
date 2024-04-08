import type { SummaryFilterSchemaType } from '$lib/schema/summarySchema';
import { SQL, gte, lte } from 'drizzle-orm';

export const summaryFilterToQueryMaterialized = ({
	where,
	filter: restFilter,
	table
}: {
	where: SQL<unknown>[];
	filter: SummaryFilterSchemaType;
	table: {
		count: SQL.Aliased<number>;
		sum: SQL.Aliased<number>;
		firstDate: SQL.Aliased<Date | null>;
		lastDate: SQL.Aliased<Date | null>;
	};
}) => {
	if (restFilter.countMax !== undefined) where.push(lte(table.count, restFilter.countMax));
	if (restFilter.countMin !== undefined) where.push(gte(table.count, restFilter.countMin));
	if (restFilter.totalMax !== undefined) where.push(lte(table.sum, restFilter.totalMax));
	if (restFilter.totalMin !== undefined) where.push(gte(table.sum, restFilter.totalMin));

	if (restFilter.firstDateMax)
		//@ts-expect-error date type comparison works better this way
		where.push(lte(table.firstDate, new Date(restFilter.firstDateMax).toISOString().slice(0, 10)));

	if (restFilter.firstDateMin)
		//@ts-expect-error date type comparison works better this way
		where.push(gte(table.firstDate, new Date(restFilter.firstDateMin).toISOString().slice(0, 10)));

	if (restFilter.lastDateMax)
		//@ts-expect-error date type comparison works better this way
		where.push(lte(table.lastDate, new Date(restFilter.lastDateMax).toISOString().slice(0, 10)));

	if (restFilter.lastDateMin)
		//@ts-expect-error date type comparison works better this way
		where.push(gte(table.lastDate, new Date(restFilter.lastDateMin).toISOString().slice(0, 10)));
};

export const summaryFilterToText = ({
	stringArray,
	filter
}: {
	stringArray: string[];
	filter: SummaryFilterSchemaType;
}) => {
	if (filter.countMax !== undefined) stringArray.push(`Max Journal Count of ${filter.countMax}`);
	if (filter.countMin !== undefined) stringArray.push(`Min Journal Count of ${filter.countMin}`);
	if (filter.totalMax !== undefined) stringArray.push(`Max sum of ${filter.totalMax}`);
	if (filter.totalMin !== undefined) stringArray.push(`Min sum of ${filter.totalMin}`);
	if (filter.firstDateMax) stringArray.push(`First Date Max: ${filter.firstDateMax}`);
	if (filter.firstDateMin) stringArray.push(`First Date Min: ${filter.firstDateMin}`);
	if (filter.lastDateMax) stringArray.push(`Last Date Max: ${filter.lastDateMax}`);
	if (filter.lastDateMin) stringArray.push(`Last Date Min: ${filter.lastDateMin}`);
};
