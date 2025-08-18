import { eq, and, desc, asc, count, gte, lte, isNull, inArray } from 'drizzle-orm';
import { getLogDatabase, LogDBType } from './connection.js';
import { logTable, configurationTable, type LogInsert, type LogSelect, type ConfigurationInsert, type ConfigurationSelect, logLevelEnum, logDomainEnum, logActionEnum, logDestinationEnum } from './schema/index.js';

export type LogLevelType  = typeof logLevelEnum[number]
export type LogDomainType = typeof logDomainEnum[number];
export type LogActionType = typeof logActionEnum[number];
export type LogDestinationType = typeof logDestinationEnum[number];

export interface LogEntry {
	date: Date;
	logLevel: LogLevelType;
	contextId?: string;
	action?: LogActionType;
	domain: LogDomainType;
	code: string;
	title: string;
	data?: any;
}

export class LogDatabaseOperations {

	private db: LogDBType

	constructor(db: LogDBType) {
		this.db = db
	}

	async insertLog(entry: LogEntry): Promise<void> {
		try {

			console.log("Inserting Log");

			await this.db.insert(logTable).values({
				date: entry.date,
				logLevel: entry.logLevel,
				contextId: entry.contextId,
				action: entry.action || "",
				domain: entry.domain,
				code: entry.code,
				title: entry.title,
				data: entry.data ? JSON.stringify(entry.data) : null
			});
		} catch (error) {
			console.error('Failed to insert log entry:', error);
		}
	}

	async batchInsertLogs(entries: LogEntry[]): Promise<void> {
		try {
			const values = entries.map(entry => ({
				date: entry.date,
				logLevel: entry.logLevel,
				contextId: entry.contextId,
				action: entry.action || "",
				domain: entry.domain,
				code: entry.code,
				title: entry.title,
				data: entry.data ? JSON.stringify(entry.data) : null
			}) satisfies LogInsert)
			
			await this.db.insert(logTable).values(values);
		} catch (error) {
			console.error('Failed to batch insert log entries:', error);
		}
	}

	async getLogs(params: {
		domain?: LogDomainType;
		action?: LogActionType;
		logLevel?: LogLevelType;
		contextId?: string;
		code?: string;
		startDate?: Date;
		endDate?: Date;
		limit?: number;
		offset?: number;
	} = {}): Promise<LogSelect[]> {
		try {
			const conditions = [];
			
			if (params.domain) conditions.push(eq(logTable.domain, params.domain));
			if (params.action) conditions.push(eq(logTable.action, params.action));
			if (params.logLevel) conditions.push(eq(logTable.logLevel, params.logLevel));
			if (params.contextId) conditions.push(eq(logTable.contextId, params.contextId));
			if (params.code) conditions.push(eq(logTable.code, params.code));
			if (params.startDate) conditions.push(gte(logTable.date, params.startDate));
			if (params.endDate) conditions.push(lte(logTable.date, params.endDate));
			
			let baseQuery = this.db.select().from(logTable);
			
			if (conditions.length > 0) {
				baseQuery = baseQuery.where(and(...conditions)) as any;
			}
			
			baseQuery = baseQuery.orderBy(desc(logTable.date)) as any;
			
			if (params.limit) {
				baseQuery = baseQuery.limit(params.limit) as any;
			}
			
			if (params.offset) {
				baseQuery = baseQuery.offset(params.offset) as any;
			}
			
			return await baseQuery;
		} catch (error) {
			console.error('Failed to get logs:', error);
			return [];
		}
	}

	async getLogCount(params: {
		domain?: LogDomainType;
		action?: LogActionType;
		logLevel?: LogLevelType;
		contextId?: string;
		code?: string;
		startDate?: Date;
		endDate?: Date;
	} = {}): Promise<number> {
		try {
			const conditions = [];
			
			if (params.domain) conditions.push(eq(logTable.domain, params.domain));
			if (params.action) conditions.push(eq(logTable.action, params.action));
			if (params.logLevel) conditions.push(eq(logTable.logLevel, params.logLevel));
			if (params.contextId) conditions.push(eq(logTable.contextId, params.contextId));
			if (params.code) conditions.push(eq(logTable.code, params.code));
			if (params.startDate) conditions.push(gte(logTable.date, params.startDate));
			if (params.endDate) conditions.push(lte(logTable.date, params.endDate));
			
			let baseQuery = this.db.select({ count: count() }).from(logTable);
			
			if (conditions.length > 0) {
				baseQuery = baseQuery.where(and(...conditions)) as any;
			}
			
			const result = await baseQuery;
			return result[0]?.count || 0;
		} catch (error) {
			console.error('Failed to get log count:', error);
			return 0;
		}
	}

	async setLogConfiguration(destination: LogDestinationType, domain: LogDomainType, action: LogActionType | null, logLevel: LogLevelType): Promise<void> {
		try {
			const existing = await this.db
				.select()
				.from(configurationTable)
				.where(
					action 
						? and(eq(configurationTable.destination, destination), eq(configurationTable.domain, domain), eq(configurationTable.action, action))
						: and(eq(configurationTable.destination, destination), eq(configurationTable.domain, domain), isNull(configurationTable.action))
				);

			if (existing.length > 0) {
				await this.db
					.update(configurationTable)
					.set({ logLevel, updatedAt: new Date() })
					.where(
						action 
							? and(eq(configurationTable.destination, destination), eq(configurationTable.domain, domain), eq(configurationTable.action, action))
							: and(eq(configurationTable.destination, destination), eq(configurationTable.domain, domain), isNull(configurationTable.action))
					);
			}
			else {
				throw new Error("Log Configuration Not Found")
			}
		} catch (error) {
			console.error('Failed to set log configuration:', error);
		}
	}

	async getLogConfiguration(destination?: LogDestinationType, domain?: LogDomainType): Promise<ConfigurationSelect[]> {
		try {
			let baseQuery = this.db.select().from(configurationTable);
			
			const conditions = [];
			if (destination) conditions.push(eq(configurationTable.destination, destination));
			if (domain) conditions.push(eq(configurationTable.domain, domain));
			
			if (conditions.length > 0) {
				baseQuery = baseQuery.where(and(...conditions)) as any;
			}
			
			baseQuery = baseQuery.orderBy(asc(configurationTable.destination), asc(configurationTable.domain), asc(configurationTable.action)) as any;
			
			return await baseQuery;
		} catch (error) {
			console.error('Failed to get log configuration:', error);
			return [];
		}
	}

	async getLogLevel(destination: LogDestinationType, domain: LogDomainType, action?: LogActionType): Promise<LogLevelType | null> {
		try {
			if (action) {
				const exactMatch = await this.db
					.select()
					.from(configurationTable)
					.where(and(eq(configurationTable.destination, destination), eq(configurationTable.domain, domain), eq(configurationTable.action, action)))
					.limit(1);
				
				if (exactMatch.length > 0) {
					return exactMatch[0].logLevel;
				}
			}
			
			const domainMatch = await this.db
				.select()
				.from(configurationTable)
				.where(and(eq(configurationTable.destination, destination), eq(configurationTable.domain, domain), isNull(configurationTable.action)))
				.limit(1);
			
			if (domainMatch.length > 0) {
				return domainMatch[0].logLevel;
			}
			
			return null;
		} catch (error) {
			console.error('Failed to get log level for domain/action:', error);
			return null;
		}
	}

	async initLogConfiguration() {
		try {
			const requiredConfigs = logDestinationEnum.map(destination => {
				return logActionEnum.map(action => {
					return logDomainEnum.map(domain => ({
						destination,
						domain,
						action,
						logLevel: "INFO" as LogLevelType,
					}));
				}).flat();
			}).flat();

			const existingLogConfiguration = await this.getAllLogConfigurations();

			const configurationsToCreate = requiredConfigs.filter(configuration => {
				return !existingLogConfiguration.some(existingConfig => {
					return (
						existingConfig.destination === configuration.destination &&
						existingConfig.domain === configuration.domain &&
						existingConfig.action === configuration.action
					);
				});
			});

			const configurationsToDelete = existingLogConfiguration.filter(existingConfig => {
				return !requiredConfigs.some(requiredConfig => {
					return (
						requiredConfig.destination === existingConfig.destination &&
						requiredConfig.domain === existingConfig.domain &&
						requiredConfig.action === existingConfig.action
					);
				});
			});
			const configurationIdsToDelete = configurationsToDelete.map(config => config.id);

			if(configurationsToCreate.length > 0){
				await this.db.insert(configurationTable).values(configurationsToCreate);
			}
			if(configurationsToDelete.length > 0){
				await this.db.delete(configurationTable).where(inArray(configurationTable.id, configurationIdsToDelete));
			}

		} catch (e) {
			console.log("Error Initialising Log Configuration", e)
		}
	}

	async getAllLogConfigurations(): Promise<ConfigurationSelect[]> {
		try {
			return await this.db
				.select()
				.from(configurationTable)
				.orderBy(asc(configurationTable.destination), asc(configurationTable.domain), asc(configurationTable.action));
		} catch (error) {
			console.error('Failed to get all log configurations:', error);
			return [];
		}
	}

	async syncConfigurationToMemory(): Promise<Map<string, LogLevelType>> {
		try {
			const configs = await this.getAllLogConfigurations();
			const configMap = new Map<string, LogLevelType>();
			
			configs.forEach(config => {
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

	getDefaultLogLevel(destination: LogDestinationType): LogLevelType {
		const defaults: Record<LogDestinationType, LogLevelType> = {
			console: 'WARN',
			database: 'TRACE'
		};
		return defaults[destination];
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

	
	async deleteOldLogs(olderThanDays: number = 30): Promise<number> {
		try {
			const cutoffDate = new Date();
			cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
			
			const result = await this.db
				.delete(logTable)
				.where(lte(logTable.date, cutoffDate));
			
			return (result as any).changes || 0;
		} catch (error) {
			console.error('Failed to delete old logs:', error);
			return 0;
		}
	}
}