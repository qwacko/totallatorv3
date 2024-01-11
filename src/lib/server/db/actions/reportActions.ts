import type { CreateReportType, UpdateReportLayoutType } from '$lib/schema/reportSchema';
import { nanoid } from 'nanoid';
import type { DBType } from '../db';
import { report, reportElement } from '../postgres/schema';
import { updatedTime } from './helpers/misc/updatedTime';
import { filterNullUndefinedAndDuplicates } from '$lib/helpers/filterNullUndefinedAndDuplicates';
import { reportLayoutOptions } from '../../../../routes/(loggedIn)/reports/create/reportLayoutOptions';
import { eq } from 'drizzle-orm';
import { logging } from '$lib/server/logging';

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
	},
	updateLayout: async ({
		db,
		layoutConfig
	}: {
		db: DBType;
		layoutConfig: UpdateReportLayoutType;
	}) => {
		const { id, reportElements } = layoutConfig;

		const reportConfig = await reportActions.getReportConfig({ db, id });

		if (!reportConfig) {
			throw new Error('Report not found');
		}

		//Confirm that all reportElements are in the reportConfig
		const reportElementIds = reportElements.map((item) => item.id);
		const reportConfigElementIds = reportConfig.reportElements.map((item) => item.id);

		if (reportElementIds.length !== reportConfigElementIds.length) {
			throw new Error('Report element count mismatch');
		}

		const reportElementIdsMatch = reportElementIds.every((item) =>
			reportConfigElementIds.includes(item)
		);

		if (!reportElementIdsMatch) {
			throw new Error('Report element id mismatch');
		}

		//Make sure the report elements are continuous and contiguous by sorting an then setting to order to the index
		//rather than directly using the provided order.
		const reportElementsAdjusted = reportElements
			.sort((a, b) => a.order - b.order)
			.map((item, index) => ({
				...item,
				order: index + 1
			}));

		//Update the reportElements
		await db.transaction(async (trx) => {
			await Promise.all(
				reportElementsAdjusted.map(async (currentReportElement) => {
					await trx
						.update(reportElement)
						.set(currentReportElement)
						.where(eq(reportElement.id, currentReportElement.id))
						.execute();
				})
			);
		});
	}
};
export type ReportLayoutConfigType = Exclude<
	Awaited<ReturnType<typeof reportActions.getReportConfig>>,
	undefined
>;

export type ReportDropdownType = Awaited<ReturnType<typeof reportActions.listForDropdown>>;
