import { type Span, SpanStatusCode, trace } from '@opentelemetry/api';
import pino from 'pino';
import pretty from 'pino-pretty';

import {
	initializeLogDatabase,
	type LogActionType,
	LogDatabaseOperations,
	LogDBType,
	type LogDestinationType,
	type LogDomainType,
	type LogEntry,
	LogEntryInsert,
	type LogLevelType
} from '@totallator/log-database';
import type {
	LogFilterConfigValidationOutputType,
	LogFilterValidationOutputType
} from '@totallator/shared';
import { logActionEnum, logDomainEnum } from '@totallator/shared';

import { LokiForwarder, type LokiLogEntry } from './lokiForwarder';

// Local Loki types to avoid import issues
interface LokiLogEntryType {
	timestamp: number;
	level: string;
	domain: string;
	action?: string;
	code: string;
	title: string;
	message?: string;
	userId?: string;
	requestId?: string;
	routeId?: string;
	traceId?: string;
	spanId?: string;
	[key: string]: any;
}

/**
 * Available log levels in order of increasing verbosity.
 */
export type LogClass = LogLevelType;

/**
 * Fixed set of child logger names for different application domains.
 * These represent the main functional areas of the application.
 * Re-exported from @totallator/log-database for consistency.
 */
export const loggerDomains = logDomainEnum;
export type LoggerDomain = LogDomainType;

/**
 * Available logger actions for tracking operation types.
 * Re-exported from @totallator/log-database for consistency.
 */
export const loggerActions = logActionEnum;
export type LoggerAction = LogActionType;

type LogLevelCacheType = Map<string, LogLevelType>;

/**
 * Extract current trace context from OpenTelemetry API
 */
function getTraceContext(): { traceId?: string; spanId?: string; traceFlags?: string } {
	try {
		const activeSpan = trace.getActiveSpan();
		if (!activeSpan) {
			return {};
		}

		const spanContext = activeSpan.spanContext();
		return {
			traceId: spanContext.traceId,
			spanId: spanContext.spanId,
			traceFlags: spanContext.traceFlags?.toString(16)
		};
	} catch (error) {
		// OpenTelemetry not available or no active span
		return {};
	}
}

/**
 * Forward log to Loki asynchronously (non-blocking)
 */
async function forwardToLoki(
	level: LogLevelType,
	domain: LogDomainType,
	action: LogActionType | undefined,
	data: StructuredLogData,
	traceContext: ReturnType<typeof getTraceContext>,
	enhancedContext: any
): Promise<void> {
	if (process.env.LOKI_ENABLE !== 'true') return;

	try {
		// Create log message as plain string (not JSON encoded)
		const logMessage = `${data.title}${data.message ? ': ' + data.message : ''}`;

		// Build stream labels with proper trace ID format for Grafana correlation
		const streamLabels: Record<string, string> = {
			service: 'totallator',
			level: level.toLowerCase(),
			domain,
			...(action && { action }),
			...(enhancedContext?.request?.user?.id && { user_id: enhancedContext.request.user.id }),
			...(enhancedContext?.request?.requestId && { request_id: enhancedContext.request.requestId }),
			...(enhancedContext?.request?.routeId && { route_id: enhancedContext.request.routeId })
		};

		// Add trace and span IDs in Grafana-compatible format
		if (traceContext.traceId) {
			// Grafana Tempo expects trace_id in this format for correlation
			streamLabels.trace_id = traceContext.traceId;
		}
		if (traceContext.spanId) {
			streamLabels.span_id = traceContext.spanId;
		}

		// Build log entry with all data for Loki
		const logEntry = {
			timestamp: Date.now(),
			level: level.toLowerCase(),
			domain,
			action,
			code: data.code,
			title: data.title,
			message: data.title,
			userId: enhancedContext?.request?.user?.id,
			requestId: enhancedContext?.request?.requestId,
			routeId: enhancedContext?.request?.routeId,
			traceId: traceContext.traceId,
			spanId: traceContext.spanId,
			...Object.fromEntries(
				Object.entries(data).filter(([key]) => !['code', 'title'].includes(key))
			)
		};

		// Send to Loki using simple fetch (non-blocking)
		fetch(process.env.LOKI_ENDPOINT || 'http://loki:3100/loki/api/v1/push', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				streams: [
					{
						stream: streamLabels,
						values: [[`${logEntry.timestamp}000000`, JSON.stringify(logEntry)]]
					}
				]
			})
		}).catch((error) => {
			// Silently fail to avoid impacting application performance
			console.error('❌ Failed to forward log to Loki:', error);
		});
	} catch (error) {
		// Silently fail to avoid impacting application performance
		console.error('❌ Error creating Loki log entry:', error);
	}
}

/**
 * Complete logging system interface including database operations and management
 */
export interface LoggingSystem {
	/** Logger factory for creating domain/action specific loggers */
	logger: LoggerFactory;

	/** Database connection for log storage */
	loggingDB: LogDBType;

	/** Database operations instance */
	logDatabaseOps: LogDatabaseOperations;

	/** Log level cache for performance */
	logLevelCache: LogLevelCacheType;

	/** Sync log levels from database to memory cache */
	syncLogLevelsFromDatabase: () => Promise<void>;

	/** Set log level for a specific destination/domain/action combination */
	setLogLevel: (params: {
		filter: LogFilterConfigValidationOutputType;
		logLevel: LogLevelType;
	}) => Promise<void>;

	/** Query logged items from the database */
	queryLoggedItems: (
		params: LogFilterValidationOutputType & { limit?: number; offset?: number }
	) => Promise<LogEntry[]>;

	/** Get count of logged items matching criteria */
	getLoggedItemsCount: (params: LogFilterValidationOutputType) => Promise<number>;

	/** Delete old log entries from the database */
	deleteOldLogs: (data: { olderThanDays?: number; maxCount?: number }) => Promise<number>;

	/** Loki forwarder for centralized log aggregation */
	lokiForwarder: LokiForwarder;
}

/**
 * Structured log data requiring code and title with optional additional fields.
 */
export interface StructuredLogData {
	/** Unique code for easy log filtering and fault tracking */
	code: string;
	/** Human-readable title/message describing the event */
	title: string;
	/** Any additional data to include in the log */
	[key: string]: unknown;
}

/**
 * Enhanced logger with structured logging methods that require codes.
 */
export interface StructuredLogger {
	/** Log error with required code and title */
	error(data: StructuredLogData): void;
	/** Log warning with required code and title */
	warn(data: StructuredLogData): void;
	/** Log info with required code and title */
	info(data: StructuredLogData): void;
	/** Log debug with required code and title */
	debug(data: StructuredLogData): void;
	/** Log trace with required code and title */
	trace(data: StructuredLogData): void;
	/** Access to underlying pino logger for advanced use */
	pino: pino.Logger;
}

/**
 * Logger factory that creates child loggers for specific domains and actions.
 * Returns enhanced structured loggers that enforce code requirements.
 */
export interface LoggerFactory {
	/** Get or create a structured logger for a specific domain */
	(domain: LoggerDomain): StructuredLogger;
	/** Get or create a structured logger for a specific domain and action */
	(domain: LoggerDomain, action: LoggerAction): StructuredLogger;
	/** Direct access to root Pino logger for advanced features */
	pino: pino.Logger;
}

/**
 * Get the appropriate log level for a domain/action combination.
 * Checks database cache first, then overrides, then falls back to default.
 */
const getLogLevelForDomainAction = (
	logDatabaseOps: LogDatabaseOperations | null,
	logLevelCache: LogLevelCacheType,
	domain: LoggerDomain,
	action?: LoggerAction,
	destination: LogDestinationType = 'console'
): pino.Level => {
	// Convert our database types to match existing logger types
	const dbDomain = domain as LogDomainType;
	const dbAction = action as LogActionType;

	// Check database cache first for console destination
	if (logDatabaseOps) {
		const exactKey = action
			? `${destination}:${dbDomain}:${dbAction}`
			: `${destination}:${dbDomain}`;
		const cachedLevel = logLevelCache.get(exactKey);

		if (cachedLevel) {
			return logDatabaseOps.convertToPinoLevel(cachedLevel) as pino.Level;
		}

		// Try domain-only match if action-specific wasn't found
		if (action) {
			const domainKey = `${destination}:${dbDomain}`;
			const domainLevel = logLevelCache.get(domainKey);
			if (domainLevel) {
				return logDatabaseOps.convertToPinoLevel(domainLevel) as pino.Level;
			}
		}
	}

	// Fall back to default
	return 'info';
};

/**
 * Create a comprehensive logging system with database integration.
 *
 * This function handles both logger creation and database initialization, returning
 * a complete logging system interface that can be placed directly in the global context.
 *
 * @param contextId Optional unique context identifier to include in all logs
 * @param databaseClient Database configuration for log storage
 * @param getRequestContext Optional function to get current request context for enhanced logging
 * @returns Complete logging system with database operations and logger factory
 */
export const createLogger = async (
	contextId?: string,
	databaseClient?: Parameters<typeof initializeLogDatabase>[0],
	getRequestContext?: () => any
): Promise<LoggingSystem> => {
	// Initialize database connection if config provided
	let loggingDB: LogDBType | null = null;
	let logDatabaseOps: LogDatabaseOperations | null = null;
	const logLevelCache = new Map<string, LogLevelType>();

	if (databaseClient) {
		try {
			console.log('[createLogger] Initializing log database with client:', {
				clientExists: !!databaseClient,
				clientType: typeof databaseClient
			});

			loggingDB = await initializeLogDatabase(databaseClient);
			console.log('[createLogger] initializeLogDatabase returned:', {
				loggingDBExists: !!loggingDB,
				loggingDBType: typeof loggingDB,
				hasSelect: loggingDB && typeof loggingDB.select === 'function'
			});

			logDatabaseOps = new LogDatabaseOperations(loggingDB);
			console.log('[createLogger] Created LogDatabaseOperations:', {
				logDatabaseOpsExists: !!logDatabaseOps
			});

			// Initialize configuration and sync levels
			console.log('[createLogger] Calling initLogConfiguration...');
			await logDatabaseOps.initLogConfiguration();
			const syncedCache = await logDatabaseOps.syncConfigurationToMemory();
			console.log('[createLogger] Successfully initialized LogDatabaseOperations');

			// Update our cache with synced values
			syncedCache.forEach((value, key) => {
				logLevelCache.set(key, value);
			});

			console.log('✅ Database logging initialized successfully');
		} catch (error) {
			console.warn('❌ Failed to initialize database logging:', error);
			// Continue without database logging
		}
	}

	// Create root Pino logger with basic configuration
	const stream = pretty();
	const baseContext = contextId ? { contextId } : {};

	const pinoLogger = pino(
		{
			level: 'trace', // Set to most permissive level, actual filtering done per domain/action
			base: baseContext
		},
		stream
	);

	// Cache for child loggers to avoid recreating them
	const childLoggers = new Map<string, pino.Logger>();

	/**
	 * Creates a structured logger wrapper around a pino logger instance.
	 */
	const createStructuredLogger = (
		pinoLogger: pino.Logger,
		domain: LoggerDomain,
		action?: LoggerAction
	): StructuredLogger => {
		const logToDatabase = async (level: LogLevelType, data: StructuredLogData) => {
			if (!logDatabaseOps) return;

			// Convert level to priority for comparison (lower number = higher priority)
			const levelPriority: Record<LogLevelType, number> = {
				ERROR: 1,
				WARN: 2,
				INFO: 3,
				DEBUG: 4,
				TRACE: 5
			};

			// Try to get enhanced context if available
			let enhancedContext: any = null;
			if (getRequestContext) {
				try {
					enhancedContext = getRequestContext();
				} catch (error) {
					// Context not available (e.g., during startup, standalone operations)
				}
			}

			// Get OpenTelemetry trace context
			const traceContext = getTraceContext();

			// Check if database destination should log this level
			const dbLevel = logLevelCache.get(
				action ? `database:${domain}:${action}` : `database:${domain}`
			);

			if (dbLevel && levelPriority[level] <= levelPriority[dbLevel]) {
				const { code, title, ...restData } = data;

				const logEntry: LogEntryInsert = {
					date: new Date(),
					logLevel: level,
					contextId: contextId,
					requestId: enhancedContext?.request?.requestId,
					userId: enhancedContext?.request?.user?.id,
					routeId: enhancedContext?.request?.routeId,
					url: enhancedContext?.request?.url,
					method: enhancedContext?.request?.method,
					userAgent: enhancedContext?.request?.userAgent,
					ip: enhancedContext?.request?.ip,
					action: action as LogActionType,
					domain: domain as LogDomainType,
					code: data.code,
					title: data.title,
					data: {
						...restData,
						// Add trace context to log data for correlation
						...(traceContext.traceId && { traceId: traceContext.traceId }),
						...(traceContext.spanId && { spanId: traceContext.spanId }),
						...(traceContext.traceFlags && { traceFlags: traceContext.traceFlags })
					}
				};

				try {
					await logDatabaseOps.insertLog(logEntry);
				} catch (error) {
					// Silently fail to avoid logging loops
				}
			}

			// Check if Loki destination should log this level
			const lokiLevel = logLevelCache.get(action ? `loki:${domain}:${action}` : `loki:${domain}`);

			if (lokiLevel && levelPriority[level] <= levelPriority[lokiLevel]) {
				// Forward to Loki asynchronously (non-blocking)
				forwardToLoki(level, domain, action, data, traceContext, enhancedContext);
			}
		};

		return {
			error: (data: StructuredLogData) => {
				const { title, ...rest } = data;
				const traceContext = getTraceContext();
				pinoLogger.error(
					{
						...rest,
						...(traceContext.traceId && { traceId: traceContext.traceId }),
						...(traceContext.spanId && { spanId: traceContext.spanId })
					},
					title
				);
				logToDatabase('ERROR', data);
			},
			warn: (data: StructuredLogData) => {
				const { title, ...rest } = data;
				const traceContext = getTraceContext();
				pinoLogger.warn(
					{
						...rest,
						...(traceContext.traceId && { traceId: traceContext.traceId }),
						...(traceContext.spanId && { spanId: traceContext.spanId })
					},
					title
				);
				logToDatabase('WARN', data);
			},
			info: (data: StructuredLogData) => {
				const { title, ...rest } = data;
				const traceContext = getTraceContext();
				pinoLogger.info(
					{
						...rest,
						...(traceContext.traceId && { traceId: traceContext.traceId }),
						...(traceContext.spanId && { spanId: traceContext.spanId })
					},
					title
				);
				logToDatabase('INFO', data);
			},
			debug: (data: StructuredLogData) => {
				const { title, ...rest } = data;
				const traceContext = getTraceContext();
				pinoLogger.debug(
					{
						...rest,
						...(traceContext.traceId && { traceId: traceContext.traceId }),
						...(traceContext.spanId && { spanId: traceContext.spanId })
					},
					title
				);
				logToDatabase('DEBUG', data);
			},
			trace: (data: StructuredLogData) => {
				const { title, ...rest } = data;
				const traceContext = getTraceContext();
				pinoLogger.trace(
					{
						...rest,
						...(traceContext.traceId && { traceId: traceContext.traceId }),
						...(traceContext.spanId && { spanId: traceContext.spanId })
					},
					title
				);
				logToDatabase('TRACE', data);
			},
			pino: pinoLogger
		};
	};

	// Create the factory function with proper overloads
	function createLoggerFactory(domain: LoggerDomain): StructuredLogger;
	function createLoggerFactory(domain: LoggerDomain, action: LoggerAction): StructuredLogger;
	function createLoggerFactory(domain: LoggerDomain, action?: LoggerAction): StructuredLogger {
		const cacheKey = action ? `${domain}:${action}` : domain;

		if (!childLoggers.has(cacheKey)) {
			const contextData: any = { domain };
			if (action) {
				contextData.action = action;
			}

			// Create child logger with appropriate context and level
			const childLogger = pinoLogger.child(contextData);

			// Set the specific log level for this domain/action combination
			const specificLevel = getLogLevelForDomainAction(
				logDatabaseOps,
				logLevelCache,
				domain,
				action
			);
			childLogger.level = specificLevel;

			childLoggers.set(cacheKey, childLogger);
		}

		return createStructuredLogger(childLoggers.get(cacheKey)!, domain, action);
	}

	const loggerFactory = createLoggerFactory as LoggerFactory;
	loggerFactory.pino = pinoLogger;

	// Helper functions for database operations
	const syncLogLevelsFromDatabase = async (): Promise<void> => {
		if (!logDatabaseOps) return;

		try {
			const syncedCache = await logDatabaseOps.syncConfigurationToMemory();
			logLevelCache.clear();
			syncedCache.forEach((value, key) => {
				logLevelCache.set(key, value);
			});
		} catch (error) {
			console.warn('Failed to sync log levels from database:', error);
		}
	};

	const setLogLevel = async (params: {
		filter: LogFilterConfigValidationOutputType;
		logLevel: LogLevelType;
	}): Promise<void> => {
		if (!logDatabaseOps) {
			console.warn('Database logging not initialized');
			return;
		}

		try {
			await logDatabaseOps.setLogConfiguration(params);
			await syncLogLevelsFromDatabase();
		} catch (error) {
			console.warn('Failed to set log level:', error);
		}
	};

	const queryLoggedItems = async (params: LogFilterValidationOutputType): Promise<any[]> => {
		if (!logDatabaseOps) {
			console.warn('Database logging not initialized');
			return [];
		}

		try {
			return await logDatabaseOps.getLogs(params);
		} catch (error) {
			console.warn('Failed to query logged items:', error);
			return [];
		}
	};

	const getLoggedItemsCount = async (params: LogFilterValidationOutputType): Promise<number> => {
		if (!logDatabaseOps) {
			console.warn('Database logging not initialized');
			return 0;
		}

		try {
			return await logDatabaseOps.getLogCount(params);
		} catch (error) {
			console.warn('Failed to get logged items count:', error);
			return 0;
		}
	};

	const deleteOldLogs = async (data: {
		olderThanDays?: number;
		maxCount?: number;
	}): Promise<number> => {
		if (!logDatabaseOps) {
			console.warn('Database logging not initialized');
			return 0;
		}

		try {
			return await logDatabaseOps.deleteOldLogs(data);
		} catch (error) {
			console.warn('Failed to delete old logs:', error);
			return 0;
		}
	};

	// Initialize Loki forwarder
	const lokiForwarder = new LokiForwarder({
		endpoint: process.env.LOKI_ENDPOINT || 'http://loki:3100/loki/api/v1/push',
		batchSize: parseInt(process.env.LOKI_BATCH_SIZE || '100'),
		flushInterval: parseInt(process.env.LOKI_FLUSH_INTERVAL || '5000'),
		enabled: process.env.LOKI_ENABLE === 'true'
	});

	return {
		logger: loggerFactory,
		loggingDB: loggingDB!,
		logDatabaseOps: logDatabaseOps!,
		logLevelCache,
		syncLogLevelsFromDatabase,
		setLogLevel,
		queryLoggedItems,
		getLoggedItemsCount,
		deleteOldLogs,
		lokiForwarder
	};
};

/**
 * @deprecated Use pino.Logger directly instead
 */
export type LoggerInstance = pino.Logger;
