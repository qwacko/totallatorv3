import pino from 'pino';
import pretty from "pino-pretty";
import { 
  LogDatabaseOperations, 
  type LogEntry, 
  type LogLevelType, 
  type LogDomainType, 
  type LogActionType, 
  type LogDestinationType,
  logDomainEnum,
  logActionEnum,
  logDestinationEnum,
  logLevelEnum,
  LogDBType
} from '@totallator/log-database';

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

type LogLevelCacheType =  Map<string, LogLevelType>

/**
 * Initialize the database logging system
 */
export const initializeDatabaseLogging = async (config: { url?: string; authToken?: string, db: LogDBType }) => {
  try {
    const { initializeLogDatabase } = await import('@totallator/log-database');
    await initializeLogDatabase(config);
    
    // Only create the operations instance after the database is initialized
    const logDatabaseOps = new LogDatabaseOperations(config.db);

    const logLevelCache = new Map<string, LogLevelType>();
    
    // Initialize configuration and sync levels
    await logDatabaseOps.initLogConfiguration();
    await syncLogLevelsFromDatabase(logDatabaseOps, logLevelCache);
    
    console.log('✅ Database logging initialized successfully');
    return logDatabaseOps
  } catch (error) {
    console.warn('❌ Failed to initialize database logging:', error);
    throw new Error('Database logging initialization failed');
  }
};

/**
 * Sync log levels from database to memory cache
 */
export const syncLogLevelsFromDatabase = async (logDatabaseOps: LogDatabaseOperations, logLevelCache: LogLevelCacheType) => {
  if (!logDatabaseOps) return;
  
  try {
    logLevelCache = await logDatabaseOps.syncConfigurationToMemory();
  } catch (error) {
    console.warn('Failed to sync log levels from database:', error);
  }
};

/**
 * Set log level for a specific destination/domain/action combination
 */
export const setLogLevel = async ({destination, domain, action, level, logDatabaseOps, logLevelCache}:{destination: LogDestinationType, domain: LoggerDomain, action: LoggerAction | null, level: LogLevelType, logDatabaseOps: LogDatabaseOperations, logLevelCache: LogLevelCacheType}) => {
  if (!logDatabaseOps) {
    console.warn('Database logging not initialized');
    return;
  }
  
  try {
    await logDatabaseOps.setLogConfiguration(destination, domain as LogDomainType, action as LogActionType, level);
    await syncLogLevelsFromDatabase(logDatabaseOps, logLevelCache);
  } catch (error) {
    console.warn('Failed to set log level:', error);
  }
};

/**
 * Query logged items from the database
 */
export const queryLoggedItems = async (params: {
  domain?: LogDomainType;
  action?: LogActionType;
  logLevel?: LogLevelType;
  contextId?: string;
  code?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
  logDatabaseOps: LogDatabaseOperations
}) => {
  if (!params.logDatabaseOps) {
    console.warn('Database logging not initialized');
    return [];
  }
  
  try {
    return await params.logDatabaseOps.getLogs(params);
  } catch (error) {
    console.warn('Failed to query logged items:', error);
    return [];
  }
};

/**
 * Get count of logged items matching criteria
 */
export const getLoggedItemsCount = async (params: {
  domain?: LogDomainType;
  action?: LogActionType;
  logLevel?: LogLevelType;
  contextId?: string;
  code?: string;
  startDate?: Date;
  endDate?: Date;
  logDatabaseOps: LogDatabaseOperations
}) => {
  if (!params.logDatabaseOps) {
    console.warn('Database logging not initialized');
    return 0;
  }
  
  try {
    return await params.logDatabaseOps.getLogCount(params);
  } catch (error) {
    console.warn('Failed to get logged items count:', error);
    return 0;
  }
};

/**
 * Delete old log entries from the database
 */
export const deleteOldLogs = async (logDatabaseOps: LogDatabaseOperations, olderThanDays: number = 30) => {
  if (!logDatabaseOps) {
    console.warn('Database logging not initialized');
    return 0;
  }
  
  try {
    return await logDatabaseOps.deleteOldLogs(olderThanDays);
  } catch (error) {
    console.warn('Failed to delete old logs:', error);
    return 0;
  }
};

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
const getLogLevelForDomainAction = ({logDatabaseOps, domain, action, destination, logLevelCache}:{logLevelCache: LogLevelCacheType,logDatabaseOps: LogDatabaseOperations, domain: LoggerDomain, action?: LoggerAction, destination: LogDestinationType = 'console'}): pino.Level => {
  // Convert our database types to match existing logger types
  const dbDomain = domain as LogDomainType;
  const dbAction = action as LogActionType;
  
  // Check database cache first for console destination
  if (logDatabaseOps) {
    const exactKey = action ? `${destination}:${dbDomain}:${dbAction}` : `${destination}:${dbDomain}`;
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
  return "info";
};

/**
 * Create a configurable Pino logger instance.
 * 
 * The logger uses Pino for structured logging with pretty printing in development.
 * It respects both global enable/disable settings and per-level configuration.
 * Returns pino logger instances directly without wrapper interfaces.
 * 
 * @param enable Global logging enable/disable flag
 * @param logClasses Array of log levels to enable (e.g., ['ERROR', 'WARN', 'INFO'])
 * @param contextId Optional unique context identifier to include in all logs
 * @returns Logger factory with domain and action-specific child logger support
 */
export const createLogger = (enable: boolean, logClasses: string[], contextId?: string): LoggerFactory => {
  // Convert log classes to Pino level
  const getGlobalLogLevel = (): pino.LevelWithSilent => {
    if (!enable) return 'silent';
    
    if (logClasses.includes('TRACE')) return 'trace';
    if (logClasses.includes('DEBUG')) return 'debug';
    if (logClasses.includes('INFO')) return 'info';
    if (logClasses.includes('WARN')) return 'warn';
    if (logClasses.includes('ERROR')) return 'error';
    
    return 'silent';
  };

  // Create root Pino logger with basic configuration
  // Note: Pretty printing disabled to avoid transport resolution issues in monorepo

  const stream = pretty()

  const baseContext = contextId ? { contextId } : {};

  const pinoLogger = pino({
    level: getGlobalLogLevel(),
    base: baseContext,
    
  
  }, stream);

  // Cache for child loggers to avoid recreating them
  // Key format: "domain" or "domain:action"
  const childLoggers = new Map<string, pino.Logger>();

  /**
   * Creates a structured logger wrapper around a pino logger instance.
   */
  const createStructuredLogger = (pinoLogger: pino.Logger, domain: LoggerDomain, action?: LoggerAction): StructuredLogger => {
    const logToDatabase = async (level: LogLevelType, data: StructuredLogData) => {
      if (!logDatabaseOps) return;
      
      // Check if database destination should log this level
      const dbLevel = logLevelCache.get(action ? `database:${domain}:${action}` : `database:${domain}`);
      if (!dbLevel) return;
      
      // Convert level to priority for comparison (lower number = higher priority)
      const levelPriority: Record<LogLevelType, number> = {
        ERROR: 1, WARN: 2, INFO: 3, DEBUG: 4, TRACE: 5
      };
      
      if (levelPriority[level] <= levelPriority[dbLevel]) {
        const logEntry: LogEntry = {
          date: new Date(),
          logLevel: level,
          contextId: contextId,
          action: action as LogActionType,
          domain: domain as LogDomainType,
          code: data.code,
          title: data.title,
          data: data
        };
        
        try {
          await logDatabaseOps.insertLog(logEntry);
        } catch (error) {
          // Silently fail to avoid logging loops
        }
      }
    };

    return {
      error: (data: StructuredLogData) => {
        const { title, ...rest } = data;
        pinoLogger.error(rest, title);
        logToDatabase('ERROR', data);
      },
      warn: (data: StructuredLogData) => {
        const { title, ...rest } = data;
        pinoLogger.warn(rest, title);
        logToDatabase('WARN', data);
      },
      info: (data: StructuredLogData) => {
        const { title, ...rest } = data;
        pinoLogger.info(rest, title);
        logToDatabase('INFO', data);
      },
      debug: (data: StructuredLogData) => {
        const { title, ...rest } = data;
        pinoLogger.debug(rest, title);
        logToDatabase('DEBUG', data);
      },
      trace: (data: StructuredLogData) => {
        const { title, ...rest } = data;
        pinoLogger.trace(rest, title);
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
      const specificLevel = getLogLevelForDomainAction(domain, action);
      childLogger.level = specificLevel;
      
      childLoggers.set(cacheKey, childLogger);
    }
    
    return createStructuredLogger(childLoggers.get(cacheKey)!, domain, action);
  }

  const loggerFactory = createLoggerFactory as LoggerFactory;

  // Attach the root pino logger to the factory
  loggerFactory.pino = pinoLogger;

  return loggerFactory;
};

/**
 * @deprecated Use pino.Logger directly instead
 */
export type LoggerInstance = pino.Logger;