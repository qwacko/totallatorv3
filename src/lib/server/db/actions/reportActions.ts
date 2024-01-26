import type {
	CreateReportElementType,
	CreateReportType,
	ReportElementConfigType,
	UpdateReportElementType,
	UpdateReportLayoutType
} from '$lib/schema/reportSchema';
import { nanoid } from 'nanoid';
import type { DBType } from '../db';
import { report, reportElement, reportElementConfig } from '../postgres/schema';
import { updatedTime } from './helpers/misc/updatedTime';
import { filterNullUndefinedAndDuplicates } from '$lib/helpers/filterNullUndefinedAndDuplicates';
import { reportLayoutOptions } from '../../../../routes/(loggedIn)/reports/create/reportLayoutOptions';
import { eq, inArray } from 'drizzle-orm';
import { filter as filterTable } from '../postgres/schema';
import type { JournalFilterSchemaWithoutPaginationType } from '$lib/schema/journalSchema';
import { journalFilterToQuery, journalFilterToText } from './helpers/journal/journalFilterToQuery';
import { getData } from './helpers/report/getData';
import { materializedJournalFilterToQuery } from './helpers/journalMaterializedView/materializedJournalFilterToQuery';

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
	delete: async ({ db, id }: { db: DBType; id: string }) => {
		const reportInfo = await reportActions.getReportConfig({ db, id });

		if (!reportInfo) throw new Error('Report not found');

		await db.transaction(async (trx) => {
			await reportActions.reportElement.deleteMany({
				db: trx,
				ids: reportInfo.reportElements.map((item) => item.id)
			});
			if (reportInfo.filterId) {
				await trx.delete(filterTable).where(eq(filterTable.id, reportInfo.filterId)).execute();
			}
			await trx.delete(report).where(eq(report.id, id)).execute();
		});
	},
	create: async ({ db, data }: { db: DBType; data: CreateReportType }) => {
		const id = nanoid();

		const reportElementCreationList: CreateReportElementType[] = reportLayoutOptions[
			data.layout
		].map((item) => ({ ...item, reportId: id }));

		await db.transaction(async (trx) => {
			await trx
				.insert(report)
				.values({ id, ...data, ...updatedTime() })
				.execute();

			await reportActions.reportElement.createMany({
				db: trx,
				configurations: reportElementCreationList
			});
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
	getSimpleReportConfig: async ({ db, id }: { db: DBType; id: string }) => {
		const reportConfig = await db.query.report.findFirst({
			where: (report, { eq }) => eq(report.id, id),
			with: {
				filter: true
			}
		});

		if (!reportConfig) {
			return undefined;
		}

		return reportConfig;
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
				await reportActions.reportElement.deleteMany({ db: trx, ids: reportElementsToRemove });
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
				await reportActions.reportElement.createMany({
					db: trx,
					configurations: reportElementsToAdd
				});
			}
		});
	},
	reportElementConfiguration: {
		listReusable: async ({ db }: { db: DBType }) => {
			const reportElementConfigs = await db
				.select({ id: reportElementConfig.id, title: reportElementConfig.title })
				.from(reportElementConfig)
				.where(eq(reportElementConfig.reusable, true))
				.execute();

			return reportElementConfigs;
		},
		update: async ({ db, id, data }: { db: DBType; id: string; data: ReportElementConfigType }) => {
			const reportElementConfigData = await db.query.reportElementConfig.findFirst({
				where: (reportElementConfig, { eq }) => eq(reportElementConfig.id, id)
			});

			if (!reportElementConfigData) {
				throw new Error('Report Element Config not found');
			}

			await db
				.update(reportElementConfig)
				.set({ configuration: data, ...updatedTime() })
				.where(eq(reportElementConfig.id, id))
				.execute();

			return;
		}
	},
	reportElement: {
		getData: async ({ db, id }: { db: DBType; id: string }) => {
			const elementConfig = await db.query.reportElement.findFirst({
				where: (reportElement, { eq }) => eq(reportElement.id, id),
				with: {
					filter: true,
					report: {
						with: {
							filter: true
						}
					},
					reportElementConfig: {
						with: {
							filter: true
						}
					}
				}
			});
			const simpleElementConfigPromise = db.query.reportElement.findFirst({
				where: (reportElement, { eq }) => eq(reportElement.id, id)
			});

			if (!elementConfig) {
				throw new Error('Report Element not found');
			}

			const filters = filterNullUndefinedAndDuplicates([
				...(elementConfig.filter?.filter
					? await materializedJournalFilterToQuery(db, elementConfig.filter.filter)
					: []),
				...(elementConfig.report.filter?.filter
					? await materializedJournalFilterToQuery(db, elementConfig.report.filter.filter)
					: []),
				...(elementConfig.reportElementConfig.filter?.filter
					? await materializedJournalFilterToQuery(
							db,
							elementConfig.reportElementConfig.filter.filter
						)
					: [])
			]);

			const simpleElementConfig = await simpleElementConfigPromise;

			if (!simpleElementConfig) throw new Error('Report Element Config not found');

			const data = getData({
				db,
				config: elementConfig?.reportElementConfig.configuration,
				filters
			});

			return { ...simpleElementConfig, data };
		},
		updateConfig: async ({
			db,
			id,
			data
		}: {
			db: DBType;
			id: string;
			data: ReportElementConfigType;
		}) => {
			const reportElementData = await db.query.reportElement.findFirst({
				where: (reportElement, { eq }) => eq(reportElement.id, id),
				with: {
					reportElementConfig: true
				}
			});

			if (!reportElementData) {
				throw new Error('Report Element not found');
			}

			const reportElementConfigId = reportElementData.reportElementConfig.id;

			await reportActions.reportElementConfiguration.update({
				db,
				id: reportElementConfigId,
				data
			});

			return;
		},
		deleteMany: async ({ db, ids }: { db: DBType; ids: string[] }) => {
			const reportElements = await db.query.reportElement.findMany({
				where: (reportElement, { inArray }) => inArray(reportElement.id, ids)
			});

			const reportElementConfigIds = reportElements.map((item) => item.reportElementConfigId);

			const reportElementConfigs = await db.query.reportElementConfig.findMany({
				where: (reportElementConfig, { inArray }) =>
					inArray(reportElementConfig.id, reportElementConfigIds),
				with: {
					reportElements: true
				}
			});

			const reportElementsToDelete = reportElements.map((item) => item.id);
			const reportConfigsToDelete = filterNullUndefinedAndDuplicates(
				reportElementConfigs.map((item) => {
					if (item.locked) return undefined;
					if (item.reusable) return undefined;
					const matchingElementIds = item.reportElements.map((el) => el.id);
					const allElementIdsAreBeingRemoved = matchingElementIds.every((el) =>
						reportElementsToDelete.includes(el)
					);

					if (allElementIdsAreBeingRemoved) {
						return item.id;
					}
					return undefined;
				})
			);

			await db.transaction(async (trx) => {
				if (reportElementsToDelete.length > 0) {
					await trx
						.delete(reportElement)
						.where(inArray(reportElement.id, reportElementsToDelete))
						.execute();
				}

				if (reportConfigsToDelete.length > 0) {
					await trx
						.delete(reportElementConfig)
						.where(inArray(reportElementConfig.id, reportConfigsToDelete))
						.execute();
				}
			});
		},
		createMany: async ({
			db,
			configurations
		}: {
			db: DBType;
			configurations: CreateReportElementType[];
		}) => {
			const reportElementsData = configurations.map((item) => ({
				id: nanoid(),
				reportElementConfigId: nanoid(),
				...updatedTime(),
				...item
			}));

			const reportElementsConfigData = reportElementsData.map((item) => ({
				id: item.reportElementConfigId,
				reportElementId: item.id,
				title: item.title,
				...updatedTime()
			}));

			await db.transaction(async (trx) => {
				await trx.insert(reportElement).values(reportElementsData).execute();
				await trx.insert(reportElementConfig).values(reportElementsConfigData).execute();
			});
		},
		get: async ({ db, id }: { db: DBType; id: string }) => {
			const reportElementData = await db.query.reportElement.findFirst({
				where: (reportElement, { eq }) => eq(reportElement.id, id),
				with: {
					filter: true,
					reportElementConfig: true,
					report: {
						with: {
							filter: true
						}
					}
				}
			});

			if (!reportElementData) {
				return undefined;
			}

			return reportElementData;
		},
		update: async ({ db, data }: { db: DBType; data: UpdateReportElementType }) => {
			const { id, ...restData } = data;

			console.log('Updating Report Element : ', data);

			await db.transaction(async (trx) => {
				if (restData.clearTitle) {
					await trx
						.update(reportElement)
						.set({ title: null })
						.where(eq(reportElement.id, id))
						.execute();
				} else if (restData.title) {
					await trx
						.update(reportElement)
						.set({ title: restData.title })
						.where(eq(reportElement.id, id))
						.execute();
				}
			});

			return;
		},
		addFilter: async ({ db, id }: { db: DBType; id: string }) => {
			const reportElementData = await reportActions.reportElement.get({ db, id });

			if (!reportElementData) {
				throw new Error('Report Element not found');
			}

			const existingFilter =
				reportElementData.filter?.filter || reportElementData.report.filter?.filter;

			if (existingFilter) {
				throw new Error('Report Element Filter Exists');
			}

			const filterId = nanoid();

			const filterConfig: JournalFilterSchemaWithoutPaginationType = {};
			const filterText = (await journalFilterToText({ db, filter: filterConfig })).join(' and ');

			await db.transaction(async (trx) => {
				await trx
					.insert(filterTable)
					.values({ id: filterId, ...updatedTime(), filter: filterConfig, filterText })
					.execute();

				await trx
					.update(reportElement)
					.set({
						filterId
					})
					.where(eq(reportElement.id, id))
					.execute();
			});

			return;
		},
		updateFilter: async ({
			db,
			id,
			filter
		}: {
			db: DBType;
			id: string;
			filter: JournalFilterSchemaWithoutPaginationType;
		}) => {
			const reportElementData = await reportActions.reportElement.get({ db, id });

			if (!reportElementData) {
				throw new Error('Report Element not found');
			}

			const filterId = reportElementData.filterId;

			if (!filterId) {
				throw new Error('Report Element Filter does not exist');
			}

			const filterText = await journalFilterToText({ db, filter });

			await db.transaction(async (trx) => {
				await trx
					.update(filterTable)
					.set({
						filter,
						filterText: filterText.join(' and ')
					})
					.where(eq(filterTable.id, filterId))
					.execute();
			});

			return;
		},
		removeFilter: async ({ db, id }: { db: DBType; id: string }) => {
			const reportElementData = await reportActions.reportElement.get({ db, id });

			if (!reportElementData) {
				throw new Error('Report Element not found');
			}

			const filterId = reportElementData.filterId;

			if (!filterId) {
				return;
			}

			await db.transaction(async (trx) => {
				await trx
					.update(reportElement)
					.set({
						filterId: null
					})
					.where(eq(reportElement.id, id))
					.execute();

				await trx.delete(filterTable).where(eq(filterTable.id, filterId)).execute();
			});

			return;
		}
	}
};
export type ReportLayoutConfigType = Exclude<
	Awaited<ReturnType<typeof reportActions.getReportConfig>>,
	undefined
>;

export type ReportDropdownType = Awaited<ReturnType<typeof reportActions.listForDropdown>>;
