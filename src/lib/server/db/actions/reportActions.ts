import type { CreateReportType, UpdateReportLayoutType } from '$lib/schema/reportSchema';
import { nanoid } from 'nanoid';
import type { DBType } from '../db';
import { report, reportElement } from '../postgres/schema';
import { updatedTime } from './helpers/misc/updatedTime';
import { filterNullUndefinedAndDuplicates } from '$lib/helpers/filterNullUndefinedAndDuplicates';
import { reportLayoutOptions } from '../../../../routes/(loggedIn)/reports/create/reportLayoutOptions';
import { eq, inArray } from 'drizzle-orm';

const returnDelayedData = async <T>(data: T | Promise<T>): Promise<T> => {
	const useData = await data;
	//Delay by a random amount between 1 and 10 seconds to simulate a slow database
	await new Promise((resolve) => setTimeout(resolve, Math.random() * 10000));

	return useData;
};

const getReportElementData = ({ db, id }: { db: DBType; id: string }) => {
	//Delay by a random amount between 1 and 10 seconds to simulate a slow database
	const data = returnDelayedData(
		db.query.reportElement.findFirst({
			where: (reportElement, { eq }) => eq(reportElement.id, id)
		})
	);

	return { id, data };
};

export type GetReportElementDataType = ReturnType<typeof getReportElementData>;

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

		if (!reportConfig) {
			return undefined;
		}

		const reportElementData = reportConfig.reportElements.map((item) =>
			getReportElementData({ db, id: item.id })
		);

		return { ...reportConfig, reportElementsWithData: reportElementData };
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

		//Make sure the report elements are continuous and contiguous by sorting an then setting to order to the index
		//rather than directly using the provided order.
		const reportElementsAdjusted = reportElements
			.sort((a, b) => a.order - b.order)
			.map((item, index) => ({
				...item,
				order: index + 1
			}));

		//List existing report elements to remove
		const reportElementsToRemove = reportConfig.reportElements
			.filter((item) => !reportElements.find((el) => el.id === item.id))
			.map((item) => item.id);

		//List existing report elements to create
		const reportElementsToAdd = reportElementsAdjusted
			.filter((item) => item.id.startsWith('new'))
			.map((item) => ({
				...item,
				id: nanoid(),
				reportId: id,
				...updatedTime()
			}));

		//List existing report elements to update
		const reportElementsToUpdate = reportElementsAdjusted.filter(
			(item) => !item.id.startsWith('new')
		);

		//Update the reportElements
		await db.transaction(async (trx) => {
			if (reportElementsToRemove.length > 0) {
				//Remove old elements
				await trx
					.delete(reportElement)
					.where(inArray(reportElement.id, reportElementsToRemove))
					.execute();
			}

			if (reportElementsToUpdate.length > 0) {
				//Update Existing ELements
				await Promise.all(
					reportElementsToUpdate.map(async (currentReportElement) => {
						await trx
							.update(reportElement)
							.set(currentReportElement)
							.where(eq(reportElement.id, currentReportElement.id))
							.execute();
					})
				);
			}

			if (reportElementsToAdd.length > 0) {
				//Create New Elements
				await trx.insert(reportElement).values(reportElementsToAdd).execute();
			}
		});
	}
};
export type ReportLayoutConfigType = Exclude<
	Awaited<ReturnType<typeof reportActions.getReportConfig>>,
	undefined
>;

export type ReportDropdownType = Awaited<ReturnType<typeof reportActions.listForDropdown>>;
