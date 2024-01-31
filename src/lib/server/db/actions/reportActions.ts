import type {
	CreateReportElementType,
	CreateReportType,
	UpdateReportConfigurationType,
	UpdateReportElementType,
	UpdateReportLayoutType
} from '$lib/schema/reportSchema';
import { nanoid } from 'nanoid';
import type { DBType } from '../db';
import {
	report,
	reportElement,
	reportElementConfig,
	type InsertReportElementConfigType,
	filtersToReportConfigs
} from '../postgres/schema';
import { updatedTime } from './helpers/misc/updatedTime';
import { filterNullUndefinedAndDuplicates } from '$lib/helpers/filterNullUndefinedAndDuplicates';
import { reportLayoutOptions } from '../../../../routes/(loggedIn)/reports/create/reportLayoutOptions';
import { eq, inArray } from 'drizzle-orm';
import { filter as filterTable } from '../postgres/schema';
import type { JournalFilterSchemaWithoutPaginationType } from '$lib/schema/journalSchema';
import { journalFilterToText } from './helpers/journal/journalFilterToQuery';
import { getItemData } from './helpers/report/getData';
import type { ReportConfigPartIndividualSchemaType } from '$lib/schema/reportHelpers/reportConfigPartSchema';

export const reportActions = {
	delete: async ({ db, id }: { db: DBType; id: string }) => {
		const reportInfo = await reportActions.getReportConfig({ db, id });

		if (!reportInfo) throw new Error('Report not found');

		console.log('Deleting Reports');
		console.log(
			'Report Elements',
			reportInfo.reportElements.map((item) => item.id)
		);
		console.log('Filter', reportInfo.filterId);

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
			where: (report, { eq }) => eq(report.id, id)
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
				reportElements: true
			}
		});

		if (!reportConfig) {
			return undefined;
		}

		const reportElementData = await Promise.all(
			reportConfig.reportElements.map(async (item) =>
				reportActions.reportElement.getWithData({ db, id: item.id })
			)
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
	reportElementConfigItem: {
		update: async ({
			db,
			id,
			configId,
			data
		}: {
			db: DBType;
			id: string;
			configId: string;
			data: ReportConfigPartIndividualSchemaType;
		}) => {
			const reportElementConfigData = await db.query.reportElementConfig.findFirst({
				where: (reportElementConfig, { eq }) => eq(reportElementConfig.id, configId)
			});

			if (!reportElementConfigData?.config) {
				throw new Error('Report Element Config not found');
			}

			const updatedConfig = reportElementConfigData.config.map((item) => {
				if (item.id === id) {
					//ID and Order shouldn't be updated through this means
					return { ...data, id: item.id, order: item.order };
				}
				return item;
			});

			await db
				.update(reportElementConfig)
				.set({ config: updatedConfig, ...updatedTime() })
				.where(eq(reportElementConfig.id, configId))
				.execute();
		}
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
		setReusable: async ({ db, id }: { db: DBType; id: string }) => {
			const reportElementConfigData = await db.query.reportElementConfig.findFirst({
				where: (reportElementConfig, { eq }) => eq(reportElementConfig.id, id)
			});

			if (!reportElementConfigData) {
				throw new Error('Report Element Config not found');
			}

			await db
				.update(reportElementConfig)
				.set({ reusable: true })
				.where(eq(reportElementConfig.id, id))
				.execute();
		},
		clearReusable: async ({ db, id }: { db: DBType; id: string }) => {
			const reportElementConfigData = await db.query.reportElementConfig.findFirst({
				where: (reportElementConfig, { eq }) => eq(reportElementConfig.id, id),
				with: {
					reportElements: true
				}
			});

			if (!reportElementConfigData) {
				throw new Error('Report Element Config not found');
			}

			if (reportElementConfigData.reportElements.length > 1) {
				throw new Error('Report Element Config is used in multiple reports elements');
			}

			await db
				.update(reportElementConfig)
				.set({ reusable: false })
				.where(eq(reportElementConfig.id, id))
				.execute();
		},
		update: async ({ db, data }: { db: DBType; data: UpdateReportConfigurationType }) => {
			const { id, ...otherData } = data;
			const reportElementConfigData = await db.query.reportElementConfig.findFirst({
				where: (reportElementConfig, { eq }) => eq(reportElementConfig.id, id)
			});

			if (!reportElementConfigData) {
				throw new Error('Report Element Config not found');
			}

			await db
				.update(reportElementConfig)
				.set({ ...otherData, ...updatedTime() })
				.where(eq(reportElementConfig.id, id))
				.execute();

			return;
		}
	},
	reportElement: {
		getWithData: async ({ db, id }: { db: DBType; id: string }) => {
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
							filters: { with: { filter: true } }
						}
					}
				}
			});

			const simpleElementConfigPromise = db.query.reportElement.findFirst({
				where: (reportElement, { eq }) => eq(reportElement.id, id),
				with: { reportElementConfig: true }
			});

			if (!elementConfig) {
				throw new Error('Report Element not found');
			}

			const simpleElementConfig = await simpleElementConfigPromise;

			if (!simpleElementConfig) throw new Error('Report Element Config not found');

			const data = elementConfig?.reportElementConfig.config
				? elementConfig?.reportElementConfig.config.map((currentConfig) =>
						getItemData({
							db,
							config: currentConfig,
							commonFilters: filterNullUndefinedAndDuplicates([
								elementConfig.filter?.filter,
								elementConfig.report.filter?.filter
							]),
							filters: elementConfig.reportElementConfig.filters.map((item) => item.filter?.filter)
						})
					)
				: [];

			return { id: simpleElementConfig.id, elementConfig: simpleElementConfig, itemData: data };
		},
		// updateConfig: async ({
		// 	db,
		// 	id,
		// 	data
		// }: {
		// 	db: DBType;
		// 	id: string;
		// 	data: UpdateReportConfigurationType;
		// }) => {
		// 	const reportElementData = await db.query.reportElement.findFirst({
		// 		where: (reportElement, { eq }) => eq(reportElement.id, id),
		// 		with: {
		// 			reportElementConfig: true
		// 		}
		// 	});

		// 	if (!reportElementData) {
		// 		throw new Error('Report Element not found');
		// 	}

		// 	const reportElementConfigId = reportElementData.reportElementConfig.id;

		// 	await reportActions.reportElementConfiguration.update({
		// 		db,
		// 		id: reportElementConfigId,
		// 		data
		// 	});

		// 	return;
		// },
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

			const reportConfigToFiltersToDelete = await db.query.filtersToReportConfigs.findMany({
				where: (filtersToReportConfigs, { inArray }) =>
					inArray(filtersToReportConfigs.reportElementConfigId, reportConfigsToDelete)
			});

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

				if (reportConfigToFiltersToDelete.length > 0) {
					await trx
						.delete(filtersToReportConfigs)
						.where(
							inArray(
								filtersToReportConfigs.reportElementConfigId,
								reportConfigToFiltersToDelete.map((item) => item.id)
							)
						)
						.execute();

					await trx
						.delete(filterTable)
						.where(
							inArray(
								filterTable.id,
								reportConfigToFiltersToDelete.map((item) => item.filterId)
							)
						)
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

			const reportElementsConfigData: InsertReportElementConfigType[] = reportElementsData.map(
				(item) => ({
					id: item.reportElementConfigId,
					reportElementId: item.id,
					title: item.title,
					config: Array(20).map((_, index) => ({
						id: nanoid(),
						order: index + 1,
						type: 'none'
					})),
					layout: 'singleItem',
					locked: false,
					reusable: false,
					...updatedTime()
				})
			);

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
					reportElementConfig: { with: { filters: { with: { filter: true } } } },
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

export type GetReportConfigResult = Awaited<ReturnType<typeof reportActions.getReportConfig>>;

export type ReportElementDataForUse = NonNullable<
	Awaited<ReturnType<typeof reportActions.reportElement.getWithData>>
>;
// export type ReportElementDataForUse = GetReportConfigResult["reportElementsWithData"];
