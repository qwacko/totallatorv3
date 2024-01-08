import type { CreateReportType } from '$lib/schema/reportSchema';
import { nanoid } from 'nanoid';
import type { DBType } from '../db';
import { report } from '../postgres/schema';
import { updatedTime } from './helpers/misc/updatedTime';
import { filterNullUndefinedAndDuplicates } from '$lib/helpers/filterNullUndefinedAndDuplicates';

export const reportActions = {
	create: async ({ db, data }: { db: DBType; data: CreateReportType }) => {
		const id = nanoid();

		await db
			.insert(report)
			.values({ id, ...data, ...updatedTime() })
			.execute();

		return id;
	},
	listForDropdown: async ({ db }: { db: DBType }) => {
		const reports = await db
			.select({ id: report.id, title: report.title, group: report.group })
			.from(report)
			.execute();

		const reportGroups = filterNullUndefinedAndDuplicates(reports.map((item) => item.group)).sort(
			(a, b) => a.localeCompare(b)
		);

		const reportGrouped = reportGroups.map((group) => {
			return {
				group,
				reports: reports
					.filter((item) => item.group === group)
					.sort((a, b) => a.title.localeCompare(b.title))
			};
		});

		return [
			...reportGrouped,
			...reports
				.filter((item) => !item.group || item.group.length === 0)
				.sort((a, b) => a.title.localeCompare(b.title))
		];
	}
};
