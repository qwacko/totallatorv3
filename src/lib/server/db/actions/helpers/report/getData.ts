import type {
	ReportElementConfigNumberType,
	ReportElementConfigType
} from '$lib/schema/reportSchema';
import type { DBType } from '$lib/server/db/db';
import { journalExtendedView } from '$lib/server/db/postgres/schema/materializedViewSchema';
import { sum, type SQL, and, sql } from 'drizzle-orm';

export const getData = ({
	db,
	config,
	filters
}: {
	db: DBType;
	config: ReportElementConfigType | null;
	filters: SQL<any>[];
}) => {
	if (!config) return;

	if (config.type === 'number') {
		return getNumberData({ db, config, filters });
	}

	return { ...config };
};

export type ReportElementData = ReturnType<typeof getData>;

const getNumberData = ({
	db,
	config,
	filters
}: {
	db: DBType;
	config: ReportElementConfigNumberType;
	filters: SQL<any>[];
}) => {
	const dataFunction = async () => {
		const total = await db
			.select({ sum: sum(journalExtendedView.amount).mapWith(Number) })
			.from(journalExtendedView)
			.where(filters.length > 0 ? and(...filters) : sql`true`)
			.execute();

		return total[0].sum;
	};

	return { ...config, data: dataFunction() };
};

export type ReportElementNumberData = ReturnType<typeof getNumberData>;
