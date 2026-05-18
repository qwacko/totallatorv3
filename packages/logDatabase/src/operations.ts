import * as devalue from 'devalue';
import { and, asc, count, desc, eq, gte, inArray, lte } from 'drizzle-orm';

import type {
	LogFilterConfigValidationOutputType,
	LogFilterValidationOutputType
} from '@totallator/shared';
import { logActionEnum, logDestinationEnum, logDomainEnum, logLevelEnum } from '@totallator/shared';

import { LogDBType } from './connection.js';
import {
	type ConfigurationSelect,
	configurationTable,
	type LogInsert,
	type LogSelect,
	logTable
} from './schema/index.js';
import { filterConfigurationsToSQL } from './validation/logConfigFilterValidation.js';
import { filterLogsToSQL } from './validation/logFilterValidation.js';

export type LogLevelType = (typeof logLevelEnum)[number];
export type LogDomainType = (typeof logDomainEnum)[number];
export type LogActionType = (typeof logActionEnum)[number];
export type LogDestinationType = (typeof logDestinationEnum)[number];

export interface LogEntryInsert {
	date: Date;
	logLevel: LogLevelType;
	contextId?: string;
	requestId?: string;
	userId?: string;
	routeId?: string;
	url?: string;
	method?: string;
	userAgent?: string;
	ip?: string;
	action?: LogActionType;
	domain: LogDomainType;
	code: string;
	title: string;
	data?: any;
}

export interface LogEntry extends LogSelect {
	id: number;
	dataProcessed?: any;
}

export class LogDatabaseOperations {
	private db: LogDBType;

	constructor(db: LogDBType) {
		console.log('[LogDatabaseOperations] Constructor called with db:', {
			dbProvided: !!db,
			dbType: typeof db,
			dbKeys: db ? Object.keys(db).slice(0, 5) : 'no db',
			hasSelect: db && typeof db.select === 'function'
		});
		this.db = db;
	}

	async insertLog(entry: LogEntryInsert): Promise<void> {
		try {
			await this.db.insert(logTable).values({
				date: entry.date,
				logLevel: entry.logLevel,
				contextId: entry.contextId,
				requestId: entry.requestId,
				userId: entry.userId,
				routeId: entry.routeId,
				url: entry.url,
				method: entry.method,
				userAgent: entry.userAgent,
				ip: entry.ip,
				action: entry.action || '',
				domain: entry.domain,
				code: entry.code,
				title: entry.title,
				data: entry.data ? JSON.stringify(entry.data) : null,
				dataString: entry.data ? devalue.stringify(entry.data) : null
			});
		} catch (error) {
			console.error('Failed to insert log entry:', error);
		}
	}

	async batchInsertLogs(entries: LogEntryInsert[]): Promise<void> {
		try {
			const values = entries.map(
				(entry) =>
					({
						date: entry.date,
						logLevel: entry.logLevel,
						contextId: entry.contextId,
						requestId: entry.requestId,
						userId: entry.userId,
						routeId: entry.routeId,
						url: entry.url,
						method: entry.method,
						userAgent: entry.userAgent,
						ip: entry.ip,
						action: entry.action || '',
						domain: entry.domain,
						code: entry.code,
						title: entry.title,
						data: entry.data ? JSON.stringify(entry.data) : null,
						dataString: entry.data ? devalue.stringify(entry.data) : null
					}) satisfies LogInsert
			);

			await this.db.insert(logTable).values(values);
		} catch (error) {
			console.error('Failed to batch insert log entries:', error);
		}
	}

	async getLogs(
		params: LogFilterValidationOutputType & {
			limit?: number;
			offset?: number;
		} = {}
	): Promise<LogEntry[]> {
		try {
			const conditions = filterLogsToSQL(params);

			const useLimit = params.limit || 100;
			const useOffset = params.offset || 0;

			let baseQuery = this.db
				.select()
				.from(logTable)
				.where(and(...conditions))
				.orderBy(desc(logTable.date))
				.limit(useLimit)
				.offset(useOffset);

			return (await baseQuery).map((item) => {
				const { data, dataString, ...restData } = item;
				return {
					...restData,
					data,
					dataString,
					dataProcessed: dataString ? devalue.parse(dataString) : null
				};
			});
		} catch (error) {
			console.error('Failed to get logs:', error);
			return [];
		}
	}

	async getLogCount(params: LogFilterValidationOutputType = {}): Promise<number> {
		try {
			const conditions = filterLogsToSQL(params);

			let baseQuery = this.db
				.select({ count: count() })
				.from(logTable)
				.where(and(...conditions));
			const result = await baseQuery;
			return result[0]?.count || 0;
		} catch (error) {
			console.error('Failed to get log count:', error);
			return 0;
		}
	}

	async setLogConfiguration({
		filter,
		logLevel
	}: {
		filter: LogFilterConfigValidationOutputType;
		logLevel: LogLevelType;
	}): Promise<void> {
		try {
			await this.db
				.update(configurationTable)
				.set({ logLevel, updatedAt: new Date() })
				.where(and(...filterConfigurationsToSQL(filter)));
		} catch (error) {
			console.error('Failed to set log configuration:', error);
		}
	}

	async getLogConfiguration(
		filter: LogFilterConfigValidationOutputType
	): Promise<ConfigurationSelect[]> {
		try {
			const conditions = filterConfigurationsToSQL(filter);
			let baseQuery = this.db
				.select()
				.from(configurationTable)
				.where(and(...conditions))
				.orderBy(
					asc(configurationTable.destination),
					asc(configurationTable.domain),
					asc(configurationTable.action)
				) as any;

			return await baseQuery;
		} catch (error) {
			console.error('Failed to get log configuration:', error);
			return [];
		}
	}

	async initLogConfiguration() {
		try {
			const requiredConfigs = logDestinationEnum
				.map((destination) => {
					return logActionEnum
						.map((action) => {
							return logDomainEnum.map((domain) => ({
								destination,
								domain,
								action,
								logLevel: 'INFO' as LogLevelType
							}));
						})
						.flat();
				})
				.flat();

			const existingLogConfiguration = await this.getAllLogConfigurations();

			const configurationsToCreate = requiredConfigs.filter((configuration) => {
				return !existingLogConfiguration.some((existingConfig) => {
					return (
						existingConfig.destination === configuration.destination &&
						existingConfig.domain === configuration.domain &&
						existingConfig.action === configuration.action
					);
				});
			});

			const configurationsToDelete = existingLogConfiguration.filter((existingConfig) => {
				return !requiredConfigs.some((requiredConfig) => {
					return (
						requiredConfig.destination === existingConfig.destination &&
						requiredConfig.domain === existingConfig.domain &&
						requiredConfig.action === existingConfig.action
					);
				});
			});
			const configurationIdsToDelete = configurationsToDelete.map((config) => config.id);

			if (configurationsToCreate.length > 0) {
				await this.db.insert(configurationTable).values(configurationsToCreate);
			}
			if (configurationsToDelete.length > 0) {
				await this.db
					.delete(configurationTable)
					.where(inArray(configurationTable.id, configurationIdsToDelete));
			}
		} catch (e) {
			console.log('Error Initialising Log Configuration', e);
		}
	}

	async getAllLogConfigurations(): Promise<ConfigurationSelect[]> {
		console.log('[LogDatabaseOperations] getAllLogConfigurations called. this.db:', {
			dbExists: !!this.db,
			dbType: typeof this.db,
			hasSelect: this.db && typeof this.db.select === 'function',
			thisContext: this.constructor.name
		});

		try {
			if (!this.db) {
				throw new Error('Database connection is null/undefined');
			}
			if (typeof this.db.select !== 'function') {
				throw new Error(`Database select method not available. DB type: ${typeof this.db}`);
			}

			return await this.db
				.select()
				.from(configurationTable)
				.orderBy(
					asc(configurationTable.destination),
					asc(configurationTable.domain),
					asc(configurationTable.action)
				);
		} catch (error) {
			console.error('Failed to get all log configurations:', error);
			return [];
		}
	}

	async syncConfigurationToMemory(): Promise<Map<string, LogLevelType>> {
		try {
			const configs = await this.getAllLogConfigurations();
			const configMap = new Map<string, LogLevelType>();

			configs.forEach((config) => {
				const key = config.action
					? `${config.destination}:${config.domain}:${config.action}`
					: `${config.destination}:${config.domain}`;
				configMap.set(key, config.logLevel as LogLevelType);
			});

			return configMap;
		} catch (error) {
			console.error('Failed to sync configuration to memory:', error);
			return new Map();
		}
	}

	convertToPinoLevel(logLevel: LogLevelType): string {
		// Convert our log levels to Pino-compatible levels
		const levelMap: Record<LogLevelType, string> = {
			TRACE: 'trace',
			DEBUG: 'debug',
			INFO: 'info',
			WARN: 'warn',
			ERROR: 'error'
		};
		return levelMap[logLevel];
	}

	async deleteOldLogs({
		olderThanDays,
		maxCount
	}: {
		olderThanDays?: number;
		maxCount?: number;
	}): Promise<number> {
		try {
			if (!olderThanDays && !maxCount) {
				console.warn('No Limit Of Days or Count included in deleteOldLogs');
				return 0;
			}

			let removedFromDays = 0;
			let removeFromCount = 0;

			if (olderThanDays) {
				const cutoffDate = new Date();
				cutoffDate.setDate(cutoffDate.getDate() - (olderThanDays || 30));
				const removed = await this.db.delete(logTable).where(lte(logTable.date, cutoffDate));
				removedFromDays = removed.rowsAffected;
			}

			if (maxCount) {
				const counts = await this.db.select({ count: count() }).from(logTable);
				if (counts[0].count > maxCount) {
					const rowId = await this.db
						.select({ id: logTable.id })
						.from(logTable)
						.orderBy(desc(logTable.createdAt))
						.limit(1)
						.offset(maxCount);
					if (rowId.length > 0) {
						const deleted = await this.db.delete(logTable).where(lte(logTable.id, rowId[0].id));
						removeFromCount = deleted.rowsAffected;
					}
				}
			}

			return removedFromDays + removeFromCount;
		} catch (error) {
			console.error('Failed to delete old logs:', error);
			return 0;
		}
	}
}
