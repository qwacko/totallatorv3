import pino from 'pino';
import pinoPretty from 'pino-pretty';

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
  {domain: "import", level: "debug"}
];

/**
 * Logger factory that creates child loggers for specific domains and actions.
 * Returns pino logger instances directly without wrapper interfaces.
 */
export interface LoggerFactory {
  /** Get or create a child logger for a specific domain */
  (domain: LoggerDomain): pino.Logger;
  /** Get or create a child logger for a specific domain and action */
  (domain: LoggerDomain, action: LoggerAction): pino.Logger;
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
 * @returns Logger factory with domain and action-specific child logger support
 */
export const createLogger = (enable: boolean, logClasses: string[]): LoggerFactory => {
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

  // Create root Pino logger with pretty printing for development
  const pinoLogger = pino({
    level: getGlobalLogLevel(),
    ...(process.env.NODE_ENV !== 'production' ? {
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname'
        }
      }
    } : {})
  });

  // Cache for child loggers to avoid recreating them
  // Key format: "domain" or "domain:action"
  const childLoggers = new Map<string, pino.Logger>();

  // Create the factory function with proper overloads
  function createLoggerFactory(domain: LoggerDomain): pino.Logger;
  function createLoggerFactory(domain: LoggerDomain, action: LoggerAction): pino.Logger;
  function createLoggerFactory(domain: LoggerDomain, action?: LoggerAction): pino.Logger {
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
    
    return childLoggers.get(cacheKey)!;
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