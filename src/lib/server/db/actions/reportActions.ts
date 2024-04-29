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
import { eq } from 'drizzle-orm';
import { filter as filterTable } from '../postgres/schema';
import {
	journalFilterSchemaWithoutPagination,
	type JournalFilterSchemaWithoutPaginationType
} from '$lib/schema/journalSchema';
import { journalFilterToText } from './helpers/journal/journalFilterToQuery';
import { getItemData } from './helpers/report/getData';
import {
	reportConfigPartIndividualSchema,
	type ReportConfigPartFormSchemaType
} from '$lib/schema/reportHelpers/reportConfigPartSchema';
import { dateRangeMaterializedView } from '../postgres/schema/materializedViewSchema';
import type { DBDateRangeType } from './helpers/report/filtersToDateRange';
import { inArrayWrapped } from './helpers/misc/inArrayWrapped';
import { logging } from '$lib/server/logging';
import { dbExecuteLogger } from '../dbLogger';
import { tLogger } from '../transactionLogger';

export const reportActions = {
	delete: async ({ db, id }: { db: DBType; id: string }) => {
		const reportInfo = await reportActions.getReportConfig({ db, id });

		if (!reportInfo) throw new Error('Report not found');

		logging.debug('Deleting Reports');
		logging.debug(
			'Report Elements',
			reportInfo.reportElements.map((item) => item.id)
		);
		logging.debug('Filter', reportInfo.filterId);

		await tLogger(
			'Delete Report',
			db.transaction(async (trx) => {
				await reportActions.reportElement.deleteMany({
					db: trx,
					ids: reportInfo.reportElements.map((item) => item.id)
				});
				if (reportInfo.filterId) {
					await dbExecuteLogger(
						trx.delete(filterTable).where(eq(filterTable.id, reportInfo.filterId)),
						'Report - Delete - Delete Filter'
					);
				}
				await dbExecuteLogger(
					trx.delete(report).where(eq(report.id, id)),
					'Report - Delete - Delete Report'
				);
			})
		);
	},
	create: async ({ db, data }: { db: DBType; data: CreateReportType }) => {
		const id = nanoid();

		const reportElementCreationList: CreateReportElementType[] = reportLayoutOptions[
			data.layout
		].map((item) => ({ ...item, reportId: id }));

		await tLogger(
			'Create Report',
			db.transaction(async (trx) => {
				await dbExecuteLogger(
					trx.insert(report).values({ id, ...data, ...updatedTime() }),
					'Report - Create - Insert Report'
				);

				await reportActions.reportElement.createMany({
					db: trx,
					configurations: reportElementCreationList
				});
			})
		);

		return id;
	},
	listForDropdown: async ({ db }: { db: DBType }) => {
		const reports = await dbExecuteLogger(
			db.select({ id: report.id, title: report.title, group: report.group }).from(report),
			'Report - List For Dropdown'
		);

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
		const reportConfig = await dbExecuteLogger(
			db.query.report.findFirst({
				where: (report, { eq }) => eq(report.id, id)
			}),
			'Report - Get Simple Report Config'
		);

		if (!reportConfig) {
			return undefined;
		}

		return reportConfig;
	},
	getReportConfig: async ({
		db,
		id,
		pageFilter = {}
	}: {
		db: DBType;
		id: string;
		pageFilter?: JournalFilterSchemaWithoutPaginationType;
	}) => {
		const reportConfig = await dbExecuteLogger(
			db.query.report.findFirst({
				where: (report, { eq }) => eq(report.id, id),
				with: {
					filter: true,
					reportElements: true
				}
			}),
			'Report - Get Report Config'
		);

		if (!reportConfig) {
			return undefined;
		}

		const reportElementData = await Promise.all(
			reportConfig.reportElements.map(async (item) =>
				reportActions.reportElement.getWithData({ db, id: item.id, pageFilter })
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
		await tLogger(
			'Update Report Layout',
			db.transaction(async (trx) => {
				if (reportElementsToRemove.length > 0) {
					//Remove old elements
					await reportActions.reportElement.deleteMany({ db: trx, ids: reportElementsToRemove });
				}

				if (reportElementsToUpdate.length > 0) {
					//Update Existing ELements
					await Promise.all(
						reportElementsToUpdate.map(async (currentReportElement) => {
							await dbExecuteLogger(
								trx
									.update(reportElement)
									.set(currentReportElement)
									.where(eq(reportElement.id, currentReportElement.id)),
								'Report - Update Layout - Update Element'
							);
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
			})
		);
	},
	addFilter: async ({ db, id }: { db: DBType; id: string }) => {
		const reportConfig = await reportActions.getSimpleReportConfig({ db, id });

		if (!reportConfig) {
			throw new Error('Report not found');
		}

		if (reportConfig.filterId) {
			throw new Error('Report Filter Exists');
		}

		const filterId = nanoid();

		await tLogger(
			'Add Filter',
			db.transaction(async (trx) => {
				await reportActions.filter.create({ db: trx, id: filterId });

				await dbExecuteLogger(
					trx
						.update(report)
						.set({
							filterId
						})
						.where(eq(report.id, id)),
					'Report - Add Filter - Update Report'
				);
			})
		);

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
		const reportConfig = await reportActions.getSimpleReportConfig({ db, id });

		if (!reportConfig) {
			throw new Error('Report not found');
		}

		const filterId = reportConfig.filterId;

		if (!filterId) {
			throw new Error("Report Doesn't Have  Filter");
		}

		await tLogger(
			'Update Filter',
			db.transaction(async (trx) => {
				await reportActions.filter.update({
					db: trx,
					filterId,
					filterConfig: filter
				});
			})
		);

		return;
	},
	upsertFilter: async ({
		db,
		id,
		filter
	}: {
		db: DBType;
		id: string;
		filter: JournalFilterSchemaWithoutPaginationType;
	}) => {
		logging.debug('Upserting Filter', filter);

		const reportConfig = await reportActions.getSimpleReportConfig({ db, id });

		if (!reportConfig) {
			throw new Error('Report not found');
		}

		const filterId = reportConfig.filterId;

		if (!filterId) {
			await reportActions.addFilter({ db, id });
		}

		await reportActions.updateFilter({ db, id, filter });
	},
	reportElementConfigItem: {
		update: async ({
			db,
			itemId,
			configId,
			data
		}: {
			db: DBType;
			itemId: string;
			configId: string;
			data: ReportConfigPartFormSchemaType;
		}) => {
			const configData = reportConfigPartIndividualSchema.safeParse({
				...data,
				id: configId
			});

			if (!configData.success) {
				throw new Error('Invalid Report Element Config');
			}

			const reportElementConfigData = await dbExecuteLogger(
				db.query.reportElementConfig.findFirst({
					where: (reportElementConfig, { eq }) => eq(reportElementConfig.id, configId)
				}),
				'Report Element Config Item - Update - Find'
			);

			if (!reportElementConfigData?.config) {
				throw new Error('Report Element Config not found');
			}

			const updatedConfig = reportElementConfigData.config.map((item) => {
				if (item.id === itemId) {
					//ID and Order shouldn't be updated through this means
					return { ...configData.data, id: item.id, order: item.order };
				}
				return item;
			});

			await dbExecuteLogger(
				db
					.update(reportElementConfig)
					.set({ config: updatedConfig, ...updatedTime() })
					.where(eq(reportElementConfig.id, configId)),
				'Report Element Config Item - Update - Update'
			);
		}
	},
	reportElementConfiguration: {
		listReusable: async ({ db }: { db: DBType }) => {
			const reportElementConfigs = await dbExecuteLogger(
				db
					.select({ id: reportElementConfig.id, title: reportElementConfig.title })
					.from(reportElementConfig)
					.where(eq(reportElementConfig.reusable, true)),
				'Report Element Configuration - List Reusable'
			);

			return reportElementConfigs;
		},
		setReusable: async ({ db, id }: { db: DBType; id: string }) => {
			const reportElementConfigData = await dbExecuteLogger(
				db.query.reportElementConfig.findFirst({
					where: (reportElementConfig, { eq }) => eq(reportElementConfig.id, id)
				}),
				'Report Element Configuration - Set Reusable - Find'
			);

			if (!reportElementConfigData) {
				throw new Error('Report Element Config not found');
			}

			await dbExecuteLogger(
				db
					.update(reportElementConfig)
					.set({ reusable: true })
					.where(eq(reportElementConfig.id, id)),
				'Report Element Configuration - Set Reusable - Update'
			);
		},
		clearReusable: async ({ db, id }: { db: DBType; id: string }) => {
			const reportElementConfigData = await dbExecuteLogger(
				db.query.reportElementConfig.findFirst({
					where: (reportElementConfig, { eq }) => eq(reportElementConfig.id, id),
					with: {
						reportElements: true
					}
				}),
				'Report Element Configuration - Clear Reusable - Find'
			);

			if (!reportElementConfigData) {
				throw new Error('Report Element Config not found');
			}

			if (reportElementConfigData.reportElements.length > 1) {
				throw new Error('Report Element Config is used in multiple reports elements');
			}

			await dbExecuteLogger(
				db
					.update(reportElementConfig)
					.set({ reusable: false })
					.where(eq(reportElementConfig.id, id)),
				'Report Element Configuration - Clear Reusable - Update'
			);
		},
		update: async ({
			db,
			reportElementId,
			data
		}: {
			db: DBType;
			reportElementId: string;
			data: UpdateReportConfigurationType;
		}) => {
			const reportElementInfo = await dbExecuteLogger(
				db.query.reportElement.findFirst({
					where: (reportElement, { eq }) => eq(reportElement.id, reportElementId),
					with: {
						reportElementConfig: true
					}
				}),
				'Report Element Configuration - Update - Find'
			);
			if (!reportElementInfo?.reportElementConfig) {
				throw new Error('Report Element Config not found');
			}
			if (reportElementInfo.reportElementConfig.locked) {
				throw new Error('Report Element Config is locked');
			}

			await dbExecuteLogger(
				db
					.update(reportElementConfig)
					.set({ ...data, ...updatedTime() })
					.where(eq(reportElementConfig.id, reportElementInfo.reportElementConfig.id)),
				'Report Element Configuration - Update - Update'
			);

			return;
		},
		addFilter: async ({ db, configId }: { db: DBType; configId: string }) => {
			const reportElementConfigData = await dbExecuteLogger(
				db.query.reportElementConfig.findFirst({
					where: (reportElementConfig, { eq }) => eq(reportElementConfig.id, configId),
					with: {
						filters: true
					}
				}),
				'Report Element Configuration - Add Filter - Find'
			);

			if (!reportElementConfigData) {
				throw new Error('Report Element Config not found');
			}

			if (reportElementConfigData.locked) {
				throw new Error('Report Element Config is locked');
			}

			const newFilterOrder =
				reportElementConfigData.filters
					.map((item) => item.order)
					.reduce((a, b) => Math.max(a, b), 0) + 1;

			const newFilterId = nanoid();

			await tLogger(
				'Add Filter',
				db.transaction(async (trx) => {
					await reportActions.filter.create({ db: trx, id: newFilterId });

					await dbExecuteLogger(
						trx.insert(filtersToReportConfigs).values({
							id: nanoid(),
							reportElementConfigId: configId,
							filterId: newFilterId,
							order: newFilterOrder,
							...updatedTime()
						}),
						'Report Element Configuration - Add Filter - Insert'
					);
				})
			);
		},
		updateFilter: async ({
			db,
			configId,
			filterId,
			filter
		}: {
			db: DBType;
			configId: string;
			filterId: string;
			filter: JournalFilterSchemaWithoutPaginationType;
		}) => {
			const reportElementConfigData = await dbExecuteLogger(
				db.query.reportElementConfig.findFirst({
					where: (reportElementConfig, { eq }) => eq(reportElementConfig.id, configId),
					with: {
						filters: true
					}
				}),
				'Report Element Configuration - Update Filter - Find'
			);

			if (!reportElementConfigData) {
				throw new Error('Report Element Config not found');
			}

			if (reportElementConfigData.locked) {
				throw new Error('Report Element Config is locked');
			}

			const filterToUpdate = reportElementConfigData.filters.find(
				(item) => item.filterId === filterId
			);

			if (!filterToUpdate) {
				throw new Error('Filter not found on configuration');
			}

			await tLogger(
				'Update Filter',
				db.transaction(async (trx) => {
					await reportActions.filter.update({
						db: trx,
						filterId,
						filterConfig: filter
					});
				})
			);

			return;
		},
		removeFilter: async ({
			db,
			configId,
			filterId
		}: {
			db: DBType;
			configId: string;
			filterId: string;
		}) => {
			const reportElementConfigData = await dbExecuteLogger(
				db.query.reportElementConfig.findFirst({
					where: (reportElementConfig, { eq }) => eq(reportElementConfig.id, configId),
					with: {
						filters: true
					}
				}),
				'Report Element Configuration - Remove Filter - Find'
			);

			if (!reportElementConfigData) {
				throw new Error('Report Element Config not found');
			}

			if (reportElementConfigData.locked) {
				throw new Error('Report Element Config is locked');
			}

			const filterToRemove = reportElementConfigData.filters.find(
				(item) => item.filterId === filterId
			);

			if (!filterToRemove) {
				throw new Error('Filter not found');
			}

			await tLogger(
				'Remove Filter From Element',
				db.transaction(async (trx) => {
					await dbExecuteLogger(
						trx
							.delete(filtersToReportConfigs)
							.where(eq(filtersToReportConfigs.id, filterToRemove.id)),
						'Report Element Configuration - Remove Filter - Delete'
					);

					await dbExecuteLogger(
						trx.delete(filterTable).where(eq(filterTable.id, filterId)),
						'Report Element Configuration - Remove Filter - Delete Filter'
					);
				})
			);
		}
	},
	filter: {
		create: async ({ db, id }: { db: DBType; id: string }) => {
			const filterConfig: JournalFilterSchemaWithoutPaginationType = {};
			const filterText = (await journalFilterToText({ db, filter: filterConfig })).join(' and ');

			await dbExecuteLogger(
				db.insert(filterTable).values({ id, ...updatedTime(), filter: filterConfig, filterText }),
				'Filter - Create - Insert'
			);
		},
		update: async ({
			db,
			filterId,
			filterConfig
		}: {
			db: DBType;
			filterId: string;
			filterConfig: JournalFilterSchemaWithoutPaginationType;
		}) => {
			const filterFromDB = await dbExecuteLogger(
				db.query.filter.findFirst({
					where: (filter, { eq }) => eq(filter.id, filterId)
				}),
				'Filter - Update - Find'
			);

			if (!filterFromDB) {
				throw new Error('Filter does not exist');
			}

			const validatedFilter = journalFilterSchemaWithoutPagination.safeParse(filterConfig);

			if (!validatedFilter.success) {
				throw new Error('Invalid Filter');
			}

			const filterText = await journalFilterToText({ db, filter: validatedFilter.data });

			await tLogger(
				'Filter Update',
				db.transaction(async (trx) => {
					await dbExecuteLogger(
						trx
							.update(filterTable)
							.set({
								filter: validatedFilter.data,
								filterText: filterText.join(' and '),
								...updatedTime()
							})
							.where(eq(filterTable.id, filterId)),
						'Filter - Update - Update'
					);
				})
			);

			return;
		}
	},
	reportElement: {
		getWithData: async ({
			db,
			id,
			pageFilter = {}
		}: {
			db: DBType;
			id: string;
			pageFilter?: JournalFilterSchemaWithoutPaginationType;
		}) => {
			const elementConfig = await dbExecuteLogger(
				db.query.reportElement.findFirst({
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
				}),
				'Report Element - Get With Data - Get Element Config'
			);

			const simpleElementConfigPromise = dbExecuteLogger(
				db.query.reportElement.findFirst({
					where: (reportElement, { eq }) => eq(reportElement.id, id),
					with: { reportElementConfig: true }
				}),
				'Report Element - Get With Data - Get Simple Element Config'
			);

			if (!elementConfig) {
				throw new Error('Report Element not found');
			}

			const simpleElementConfig = await simpleElementConfigPromise;

			if (!simpleElementConfig) throw new Error('Report Element Config not found');

			const dateRange = await dbExecuteLogger(
				db.select().from(dateRangeMaterializedView).limit(1),
				'Report Element - Get With Data - Date Range'
			);

			const processedDateRange: DBDateRangeType = {
				min: dateRange[0]?.minDate || new Date('2000-01-01'),
				max: dateRange[0]?.maxDate || new Date()
			};

			const data = elementConfig?.reportElementConfig.config
				? elementConfig?.reportElementConfig.config.map((currentConfig) =>
						getItemData({
							db,
							config: currentConfig,
							commonFilters: filterNullUndefinedAndDuplicates([
								pageFilter,
								elementConfig.filter?.filter,
								elementConfig.report.filter?.filter
							]),
							filters: elementConfig.reportElementConfig.filters,
							dbDateRange: processedDateRange,
							currency: 'USD'
						})
					)
				: [];

			return { id: simpleElementConfig.id, elementConfig: simpleElementConfig, itemData: data };
		},
		deleteMany: async ({ db, ids }: { db: DBType; ids: string[] }) => {
			const reportElements = await dbExecuteLogger(
				db.query.reportElement.findMany({
					where: (reportElement) => inArrayWrapped(reportElement.id, ids)
				}),
				'Report Element - Delete Many - Find'
			);

			const reportElementConfigIds = reportElements.map((item) => item.reportElementConfigId);

			const reportElementConfigs = await dbExecuteLogger(
				db.query.reportElementConfig.findMany({
					where: (reportElementConfig) =>
						inArrayWrapped(reportElementConfig.id, reportElementConfigIds),
					with: {
						reportElements: true
					}
				}),
				'Report Element - Delete Many - Find Configs'
			);

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

			const reportConfigToFiltersToDelete = await dbExecuteLogger(
				db.query.filtersToReportConfigs.findMany({
					where: (filtersToReportConfigs) =>
						inArrayWrapped(filtersToReportConfigs.reportElementConfigId, reportConfigsToDelete)
				}),
				'Report Element - Delete Many - Find Filters'
			);

			await tLogger(
				'Report Element - Delete Many',
				db.transaction(async (trx) => {
					if (reportElementsToDelete.length > 0) {
						await dbExecuteLogger(
							trx
								.delete(reportElement)
								.where(inArrayWrapped(reportElement.id, reportElementsToDelete)),
							'Report Element - Delete Many - Delete Elements'
						);
					}

					if (reportConfigsToDelete.length > 0) {
						await dbExecuteLogger(
							trx
								.delete(reportElementConfig)
								.where(inArrayWrapped(reportElementConfig.id, reportConfigsToDelete)),
							'Report Element - Delete Many - Delete Configs'
						);
					}

					if (reportConfigToFiltersToDelete.length > 0) {
						await dbExecuteLogger(
							trx.delete(filtersToReportConfigs).where(
								inArrayWrapped(
									filtersToReportConfigs.reportElementConfigId,
									reportConfigToFiltersToDelete.map((item) => item.id)
								)
							),
							'Report Element - Delete Many - Delete Filters'
						);

						await dbExecuteLogger(
							trx.delete(filterTable).where(
								inArrayWrapped(
									filterTable.id,
									reportConfigToFiltersToDelete.map((item) => item.filterId)
								)
							),
							'Report Element - Delete Many - Delete Filter'
						);
					}
				})
			);
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
					config: Array(20)
						.fill(1)
						.map((_, index) => ({
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

			await tLogger(
				'Report Element - Create Many',
				db.transaction(async (trx) => {
					await dbExecuteLogger(
						trx.insert(reportElement).values(reportElementsData),
						'Report Element - Create Many - Insert Elements'
					);
					await dbExecuteLogger(
						trx.insert(reportElementConfig).values(reportElementsConfigData),
						'Report Element - Create Many - Insert Configs'
					);
				})
			);
		},
		get: async ({ db, id }: { db: DBType; id: string }) => {
			const reportElementData = await dbExecuteLogger(
				db.query.reportElement.findFirst({
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
				}),
				'Report Element - Get'
			);

			if (!reportElementData) {
				return undefined;
			}

			return reportElementData;
		},
		update: async ({ db, data }: { db: DBType; data: UpdateReportElementType }) => {
			const { id, ...restData } = data;

			logging.debug('Updating Report Element : ', data);

			await tLogger(
				'Report Element - Update',
				db.transaction(async (trx) => {
					if (restData.clearTitle) {
						await dbExecuteLogger(
							trx.update(reportElement).set({ title: null }).where(eq(reportElement.id, id)),
							'Report Element - Update - Clear Title'
						);
					} else if (restData.title) {
						await dbExecuteLogger(
							trx
								.update(reportElement)
								.set({ title: restData.title })
								.where(eq(reportElement.id, id)),
							'Report Element - Update - Update Title'
						);
					}
				})
			);

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

			await tLogger(
				'Report Element - Add Filter',
				db.transaction(async (trx) => {
					await reportActions.filter.create({ db: trx, id: filterId });

					await dbExecuteLogger(
						trx
							.update(reportElement)
							.set({
								filterId
							})
							.where(eq(reportElement.id, id)),
						'Report Element - Add Filter - Update Element'
					);
				})
			);

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
				throw new Error("Report Element Doesn't Have  Filter");
			}

			await tLogger(
				'Report Element - Update Filter',
				db.transaction(async (trx) => {
					await reportActions.filter.update({
						db: trx,
						filterId,
						filterConfig: filter
					});
				})
			);

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

			await tLogger(
				'Report Element - Remove Filter',
				db.transaction(async (trx) => {
					await dbExecuteLogger(
						trx
							.update(reportElement)
							.set({
								filterId: null
							})
							.where(eq(reportElement.id, id)),
						'Report Element - Remove Filter - Update Element'
					);

					await dbExecuteLogger(
						trx.delete(filterTable).where(eq(filterTable.id, filterId)),
						'Report Element - Remove Filter - Delete Filter'
					);
				})
			);

			return;
		}
	}
};

export type ReportElementData = Awaited<ReturnType<typeof reportActions.reportElement.get>>;

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
