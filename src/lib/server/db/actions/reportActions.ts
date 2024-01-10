import type { CreateReportType } from '$lib/schema/reportSchema';
import { nanoid } from 'nanoid';
import type { DBType } from '../db';
import { report, reportElement } from '../postgres/schema';
import { updatedTime } from './helpers/misc/updatedTime';
import { filterNullUndefinedAndDuplicates } from '$lib/helpers/filterNullUndefinedAndDuplicates';
import { reportLayoutOptions } from '../../../../routes/(loggedIn)/reports/create/reportLayoutOptions';

export const reportActions = {
	create: async ({ db, data }: { db: DBType; data: CreateReportType }) => {
		const id = nanoid();
		const reportElementsData = reportLayoutOptions[data.layout].map((item) => ({
			id: nanoid(),
			reportId: id,
			...updatedTime(),
			...item
		}));

		await db.transaction(async (trx) => {
			await trx
				.insert(report)
				.values({ id, ...data, ...updatedTime() })
				.execute();

			await trx.insert(reportElement).values(reportElementsData).execute();
		});

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
	},
	getReportConfig: async ({ db, id }: { db: DBType; id: string }) => {
		const reportConfig = await db.query.report.findFirst({
			where: (report, { eq }) => eq(report.id, id),
			with: {
				filter: true,
				reportElements: {
					with: {
						filter: true,
						reportElementConfig: true
					}
				}
			}
		});

		return reportConfig;
	}
};
export type ReportLayoutConfigType = Exclude<
	Awaited<ReturnType<typeof reportActions.getReportConfig>>,
	undefined
>;

export type ReportDropdownType = Awaited<ReturnType<typeof reportActions.listForDropdown>>;
