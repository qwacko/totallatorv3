import type {
	CreateReportElementType,
	CreateReportType,
	UpdateReportConfigurationType,
	UpdateReportElementType,
	UpdateReportLayoutType
} from '@totallator/shared';
import { nanoid } from 'nanoid';
import {
	report,
	reportElement,
	reportElementConfig,
	type InsertReportElementConfigType,
	filtersToReportConfigs,
	type ReportTableType
} from '@totallator/database';
import { updatedTime } from './helpers/misc/updatedTime';
import { filterNullUndefinedAndDuplicates } from '../helpers/filterNullUndefinedAndDuplicates';
import { reportLayoutOptions } from '@totallator/shared';
import { eq } from 'drizzle-orm';
import { filter as filterTable } from '@totallator/database';
import {
	journalFilterSchemaWithoutPagination,
	type JournalFilterSchemaWithoutPaginationType
} from '@totallator/shared';
import { journalFilterToText } from './helpers/journal/journalFilterToQuery';
import { getItemData } from './helpers/report/getData';
import {
	reportConfigPartIndividualSchema,
	type ReportConfigPartFormSchemaType
} from '@totallator/shared';
import { dateRangeMaterializedView } from '@totallator/database';
import type { DBDateRangeType } from './helpers/report/filtersToDateRange';
import { inArrayWrapped } from './helpers/misc/inArrayWrapped';
import { getLogger } from '@/logger';
import { dbExecuteLogger } from '@/server/db/dbLogger';
import { getContextDB, runInTransactionWithLogging } from '@totallator/context';

export const reportActions = {
	delete: async ({ id }: { id: string }): Promise<void> => {
		const reportInfo = await reportActions.getReportConfig({ id });

		if (!reportInfo) throw new Error('Report not found');

		getLogger('reports').debug({
			code: 'REPORT_001',
			title: 'Deleting Reports',
			reportElements: reportInfo.reportElements.map((item) => item.id),
			filterId: reportInfo.filterId
		});

		await runInTransactionWithLogging('Delete Report', async () => {
			await reportActions.reportElement.deleteMany({
				ids: reportInfo.reportElements.map((item) => item.id)
			});
			const db = getContextDB();
			if (reportInfo.filterId) {
				await dbExecuteLogger(
					db.delete(filterTable).where(eq(filterTable.id, reportInfo.filterId)),
					'Report - Delete - Delete Filter'
				);
			}
			await dbExecuteLogger(
				db.delete(report).where(eq(report.id, id)),
				'Report - Delete - Delete Report'
			);
		});
	},
	create: async ({ data }: { data: CreateReportType }): Promise<string> => {
		const id = nanoid();

		const reportElementCreationList: CreateReportElementType[] = reportLayoutOptions[
			data.layout
		].map((item) => ({ ...item, reportId: id }));

		await runInTransactionWithLogging('Create Report', async () => {
			const db = getContextDB();
			await dbExecuteLogger(
				db.insert(report).values({ id, ...data, ...updatedTime() }),
				'Report - Create - Insert Report'
			);

			await reportActions.reportElement.createMany({
				configurations: reportElementCreationList
			});
		});

		return id;
	},
	listForDropdown: async (): Promise<ReportDropdownType> => {
		const db = getContextDB();
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
	getSimpleReportConfig: async ({ id }: { id: string }): Promise<ReportTableType | undefined> => {
		const db = getContextDB();
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
		id,
		pageFilter = {}
	}: {
		id: string;
		pageFilter?: JournalFilterSchemaWithoutPaginationType;
	}) => {
		const db = getContextDB();
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
				reportActions.reportElement.getWithData({ id: item.id, pageFilter })
			)
		);

		return { ...reportConfig, reportElementsWithData: reportElementData };
	},
	updateLayout: async ({ layoutConfig }: { layoutConfig: UpdateReportLayoutType }) => {
		const { id, reportElements } = layoutConfig;

		const reportConfig = await reportActions.getReportConfig({ id });

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
		await runInTransactionWithLogging('Update Report Layout', async () => {
			if (reportElementsToRemove.length > 0) {
				//Remove old elements
				await reportActions.reportElement.deleteMany({ ids: reportElementsToRemove });
			}

			if (reportElementsToUpdate.length > 0) {
				//Update Existing ELements
				const db = getContextDB();
				await Promise.all(
					reportElementsToUpdate.map(async (currentReportElement) => {
						await dbExecuteLogger(
							db
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
					configurations: reportElementsToAdd
				});
			}
		});
	},
	addFilter: async ({ id }: { id: string }) => {
		const reportConfig = await reportActions.getSimpleReportConfig({ id });

		if (!reportConfig) {
			throw new Error('Report not found');
		}

		if (reportConfig.filterId) {
			throw new Error('Report Filter Exists');
		}

		const filterId = nanoid();

		await runInTransactionWithLogging('Add Filter', async () => {
			await reportActions.filter.create({ id: filterId });

			const db = getContextDB();
			await dbExecuteLogger(
				db
					.update(report)
					.set({
						filterId
					})
					.where(eq(report.id, id)),
				'Report - Add Filter - Update Report'
			);
		});

		return;
	},
	updateFilter: async ({
		id,
		filter
	}: {
		id: string;
		filter: JournalFilterSchemaWithoutPaginationType;
	}) => {
		const reportConfig = await reportActions.getSimpleReportConfig({ id });

		if (!reportConfig) {
			throw new Error('Report not found');
		}

		const filterId = reportConfig.filterId;

		if (!filterId) {
			throw new Error("Report Doesn't Have  Filter");
		}

		await runInTransactionWithLogging('Update Filter', async () => {
			await reportActions.filter.update({
				filterId,
				filterConfig: filter
			});
		});

		return;
	},
	upsertFilter: async ({
		id,
		filter
	}: {
		id: string;
		filter: JournalFilterSchemaWithoutPaginationType;
	}) => {
		getLogger('reports').debug({
			code: 'REPORT_002',
			title: 'Upserting Filter',
			filter
		});

		const reportConfig = await reportActions.getSimpleReportConfig({ id });

		if (!reportConfig) {
			throw new Error('Report not found');
		}

		const filterId = reportConfig.filterId;

		if (!filterId) {
			await reportActions.addFilter({ id });
		}

		await reportActions.updateFilter({ id, filter });
	},
	reportElementConfigItem: {
		update: async ({
			itemId,
			configId,
			data
		}: {
			itemId: string;
			configId: string;
			data: ReportConfigPartFormSchemaType;
		}) => {
			const db = getContextDB();
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
		listReusable: async () => {
			const db = getContextDB();
			const reportElementConfigs = await dbExecuteLogger(
				db
					.select({ id: reportElementConfig.id, title: reportElementConfig.title })
					.from(reportElementConfig)
					.where(eq(reportElementConfig.reusable, true)),
				'Report Element Configuration - List Reusable'
			);

			return reportElementConfigs;
		},
		setReusable: async ({ id }: { id: string }) => {
			const db = getContextDB();
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
		clearReusable: async ({ id }: { id: string }) => {
			const db = getContextDB();
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
			reportElementId,
			data
		}: {
			reportElementId: string;
			data: UpdateReportConfigurationType;
		}) => {
			const db = getContextDB();
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
		addFilter: async ({ configId }: { configId: string }) => {
			const db = getContextDB();
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

			await runInTransactionWithLogging('Add Filter', async () => {
				await reportActions.filter.create({ id: newFilterId });

				const db = getContextDB();
				await dbExecuteLogger(
					db.insert(filtersToReportConfigs).values({
						id: nanoid(),
						reportElementConfigId: configId,
						filterId: newFilterId,
						order: newFilterOrder,
						...updatedTime()
					}),
					'Report Element Configuration - Add Filter - Insert'
				);
			});
		},
		updateFilter: async ({
			configId,
			filterId,
			filter
		}: {
			configId: string;
			filterId: string;
			filter: JournalFilterSchemaWithoutPaginationType;
		}) => {
			const db = getContextDB();
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

			await runInTransactionWithLogging('Update Filter', async () => {
				await reportActions.filter.update({
					filterId,
					filterConfig: filter
				});
			});

			return;
		},
		removeFilter: async ({ configId, filterId }: { configId: string; filterId: string }) => {
			const db = getContextDB();
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

			await runInTransactionWithLogging('Remove Filter From Element', async () => {
				const db = getContextDB();
				await dbExecuteLogger(
					db.delete(filtersToReportConfigs).where(eq(filtersToReportConfigs.id, filterToRemove.id)),
					'Report Element Configuration - Remove Filter - Delete'
				);

				await dbExecuteLogger(
					db.delete(filterTable).where(eq(filterTable.id, filterId)),
					'Report Element Configuration - Remove Filter - Delete Filter'
				);
			});
		}
	},
	filter: {
		create: async ({ id }: { id: string }) => {
			const db = getContextDB();
			const filterConfig: JournalFilterSchemaWithoutPaginationType = {};
			const filterText = (await journalFilterToText({ db, filter: filterConfig })).join(' and ');

			await dbExecuteLogger(
				db.insert(filterTable).values({ id, ...updatedTime(), filter: filterConfig, filterText }),
				'Filter - Create - Insert'
			);
		},
		update: async ({
			filterId,
			filterConfig
		}: {
			filterId: string;
			filterConfig: JournalFilterSchemaWithoutPaginationType;
		}) => {
			const db = getContextDB();
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

			await runInTransactionWithLogging('Filter Update', async () => {
				const db = getContextDB();
				await dbExecuteLogger(
					db
						.update(filterTable)
						.set({
							filter: validatedFilter.data,
							filterText: filterText.join(' and '),
							...updatedTime()
						})
						.where(eq(filterTable.id, filterId)),
					'Filter - Update - Update'
				);
			});

			return;
		}
	},
	reportElement: {
		getWithData: async ({
			id,
			pageFilter = {}
		}: {
			id: string;
			pageFilter?: JournalFilterSchemaWithoutPaginationType;
		}) => {
			const db = getContextDB();
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
		deleteMany: async ({ ids }: { ids: string[] }) => {
			const db = getContextDB();
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

			await runInTransactionWithLogging('Report Element - Delete Many', async () => {
				const db = getContextDB();
				if (reportElementsToDelete.length > 0) {
					await dbExecuteLogger(
						db
							.delete(reportElement)
							.where(inArrayWrapped(reportElement.id, reportElementsToDelete)),
						'Report Element - Delete Many - Delete Elements'
					);
				}

				if (reportConfigsToDelete.length > 0) {
					await dbExecuteLogger(
						db
							.delete(reportElementConfig)
							.where(inArrayWrapped(reportElementConfig.id, reportConfigsToDelete)),
						'Report Element - Delete Many - Delete Configs'
					);
				}

				if (reportConfigToFiltersToDelete.length > 0) {
					await dbExecuteLogger(
						db.delete(filtersToReportConfigs).where(
							inArrayWrapped(
								filtersToReportConfigs.reportElementConfigId,
								reportConfigToFiltersToDelete.map((item) => item.id)
							)
						),
						'Report Element - Delete Many - Delete Filters'
					);

					await dbExecuteLogger(
						db.delete(filterTable).where(
							inArrayWrapped(
								filterTable.id,
								reportConfigToFiltersToDelete.map((item) => item.filterId)
							)
						),
						'Report Element - Delete Many - Delete Filter'
					);
				}
			});
		},
		createMany: async ({ configurations }: { configurations: CreateReportElementType[] }) => {
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

			await runInTransactionWithLogging('Report Element - Create Many', async () => {
				const db = getContextDB();
				await dbExecuteLogger(
					db.insert(reportElement).values(reportElementsData),
					'Report Element - Create Many - Insert Elements'
				);
				await dbExecuteLogger(
					db.insert(reportElementConfig).values(reportElementsConfigData),
					'Report Element - Create Many - Insert Configs'
				);
			});
		},
		get: async ({ id }: { id: string }) => {
			const db = getContextDB();
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
		update: async ({ data }: { data: UpdateReportElementType }) => {
			const { id, ...restData } = data;

			getLogger('reports').debug({
				code: 'REPORT_003',
				title: 'Updating Report Element',
				data
			});

			await runInTransactionWithLogging('Report Element - Update', async () => {
				const db = getContextDB();
				if (restData.clearTitle) {
					await dbExecuteLogger(
						db.update(reportElement).set({ title: null }).where(eq(reportElement.id, id)),
						'Report Element - Update - Clear Title'
					);
				} else if (restData.title) {
					await dbExecuteLogger(
						db.update(reportElement).set({ title: restData.title }).where(eq(reportElement.id, id)),
						'Report Element - Update - Update Title'
					);
				}
			});

			return;
		},
		addFilter: async ({ id }: { id: string }) => {
			const reportElementData = await reportActions.reportElement.get({ id });

			if (!reportElementData) {
				throw new Error('Report Element not found');
			}

			const existingFilter =
				reportElementData.filter?.filter || reportElementData.report.filter?.filter;

			if (existingFilter) {
				throw new Error('Report Element Filter Exists');
			}

			const filterId = nanoid();

			await runInTransactionWithLogging('Report Element - Add Filter', async () => {
				await reportActions.filter.create({ id: filterId });

				const db = getContextDB();
				await dbExecuteLogger(
					db
						.update(reportElement)
						.set({
							filterId
						})
						.where(eq(reportElement.id, id)),
					'Report Element - Add Filter - Update Element'
				);
			});

			return;
		},
		updateFilter: async ({
			id,
			filter
		}: {
			id: string;
			filter: JournalFilterSchemaWithoutPaginationType;
		}) => {
			const reportElementData = await reportActions.reportElement.get({ id });

			if (!reportElementData) {
				throw new Error('Report Element not found');
			}

			const filterId = reportElementData.filterId;

			if (!filterId) {
				throw new Error("Report Element Doesn't Have  Filter");
			}

			await runInTransactionWithLogging('Report Element - Update Filter', async () => {
				await reportActions.filter.update({
					filterId,
					filterConfig: filter
				});
			});

			return;
		},
		removeFilter: async ({ id }: { id: string }) => {
			const reportElementData = await reportActions.reportElement.get({ id });

			if (!reportElementData) {
				throw new Error('Report Element not found');
			}

			const filterId = reportElementData.filterId;

			if (!filterId) {
				return;
			}

			await runInTransactionWithLogging('Report Element - Remove Filter', async () => {
				const db = getContextDB();
				await dbExecuteLogger(
					db
						.update(reportElement)
						.set({
							filterId: null
						})
						.where(eq(reportElement.id, id)),
					'Report Element - Remove Filter - Update Element'
				);

				await dbExecuteLogger(
					db.delete(filterTable).where(eq(filterTable.id, filterId)),
					'Report Element - Remove Filter - Delete Filter'
				);
			});

			return;
		}
	}
};

export type ReportElementData = Awaited<ReturnType<typeof reportActions.reportElement.get>>;

export type ReportLayoutConfigType = Exclude<
	Awaited<ReturnType<typeof reportActions.getReportConfig>>,
	undefined
>;

export type ReportDropdownType = (
	| { id: string; title: string; group: string | null }
	| {
			group: string;
			reports: {
				id: string;
				title: string;
				group: string | null;
			}[];
	  }
)[];

export type GetReportConfigResult = Awaited<ReturnType<typeof reportActions.getReportConfig>>;

export type ReportElementDataForUse = NonNullable<
	Awaited<ReturnType<typeof reportActions.reportElement.getWithData>>
>;
// export type ReportElementDataForUse = GetReportConfigResult["reportElementsWithData"];
