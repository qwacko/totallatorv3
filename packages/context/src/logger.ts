import pino from 'pino';
import pretty from "pino-pretty";

/**
 * Available log levels in order of increasing verbosity.
 */
export type LogClass = 'ERROR' | 'WARN' | 'INFO' | 'DEBUG' | 'TRACE';

/**
 * Fixed set of child logger names for different application domains.
 * These represent the main functional areas of the application.
 */
export const loggerDomains = [
  'accounts',
  'auth',
  'auto-import',
  'backup',
  'bills',
  'budgets',
  'categories',
  'cron',
  'database',
  'export',
  'files',
  'import',
  'journals',
  'labels',
  'llm',
  'materialized-views',
  'notes',
  'queries',
  'reports',
  'tags',
  'users', 'server','cron'
] as const;
export type LoggerDomain = (typeof loggerDomains)[number];

export const loggerActions = [
  'Read',
  'Update',
  'Create',
  'Delete',
  'Other'
] as const;

export type LoggerAction = (typeof loggerActions)[number];


export const LOG_LEVEL_DEFAULT: pino.Level = "warn";

// Override the default log levels for specific domain/action combinations. 
// A missing action indicates that all actions for that domain will be impacted.
export const LOG_LEVEL_OVERRIDE: {domain: LoggerDomain, action?: LoggerAction, level: pino.Level}[] = [
  {domain: "import", level: "debug"},
  {domain:"files", level: "debug"},
  {domain: "journals", level: "debug"}
];

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
 * Checks overrides first, then falls back to default.
 */
const getLogLevelForDomainAction = (domain: LoggerDomain, action?: LoggerAction): pino.Level => {
  // Check for exact domain/action match first
  if (action) {
    const exactMatch = LOG_LEVEL_OVERRIDE.find(override => 
      override.domain === domain && override.action === action
    );
    if (exactMatch) return exactMatch.level;
  }
  
  // Check for domain-only match (applies to all actions in that domain)
  const domainMatch = LOG_LEVEL_OVERRIDE.find(override => 
    override.domain === domain && !override.action
  );
  if (domainMatch) return domainMatch.level;
  
  // Fall back to default
  return LOG_LEVEL_DEFAULT;
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
    transport: {
    target: 'pino-pretty',
    options: {
      colorize: true
    }}
  
  }, stream);

  // Cache for child loggers to avoid recreating them
  // Key format: "domain" or "domain:action"
  const childLoggers = new Map<string, pino.Logger>();

  /**
   * Creates a structured logger wrapper around a pino logger instance.
   */
  const createStructuredLogger = (pinoLogger: pino.Logger): StructuredLogger => {
    return {
      error: (data: StructuredLogData) => {
        const { title, ...rest } = data;
        pinoLogger.error(rest, title);
      },
      warn: (data: StructuredLogData) => {
        const { title, ...rest } = data;
        pinoLogger.warn(rest, title);
      },
      info: (data: StructuredLogData) => {
        const { title, ...rest } = data;
        pinoLogger.info(rest, title);
      },
      debug: (data: StructuredLogData) => {
        const { title, ...rest } = data;
        pinoLogger.debug(rest, title);
      },
      trace: (data: StructuredLogData) => {
        const { title, ...rest } = data;
        pinoLogger.trace(rest, title);
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
    
    return createStructuredLogger(childLoggers.get(cacheKey)!);
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