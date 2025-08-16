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
export type LoggerDomain = 
  | 'accounts'
  | 'auth'
  | 'auto-import'
  | 'backup'
  | 'bills'
  | 'budgets'
  | 'categories'
  | 'cron'
  | 'database'
  | 'export'
  | 'files'
  | 'import'
  | 'journals'
  | 'labels'
  | 'llm'
  | 'materialized-views'
  | 'notes'
  | 'queries'
  | 'reports'
  | 'tags'
  | 'users';

/**
 * Parameters that can be passed to logging functions.
 * Supports both string messages and object-based structured logging.
 */
export type LogParams = [msg: string, ...args: any[]] | [obj: object, msg?: string, ...args: any[]];

/**
 * Logger instance with all logging methods and child logger creation.
 */
export interface Logger {
  /** Log error-level messages (highest priority) */
  error: (...params: any[]) => void;
  /** Log warning-level messages */
  warn: (...params: any[]) => void;
  /** Log informational messages */
  info: (...params: any[]) => void;
  /** Log debug messages (development/troubleshooting) */
  debug: (...params: any[]) => void;
  /** Log trace messages (lowest priority, highest verbosity) */
  trace: (...params: any[]) => void;
  /** Create a child logger for a specific domain */
  child: (domain: LoggerDomain) => Logger;
  /** Direct access to underlying Pino logger for advanced features */
  pino: pino.Logger;
}

/**
 * Logger factory that creates child loggers for specific domains.
 * Provides a method to access domain-specific loggers with consistent naming.
 */
export interface LoggerFactory extends Logger {
  /** Get or create a child logger for a specific domain */
  (domain: LoggerDomain): Logger;
  /** Direct access to root Pino logger for advanced features */
  pino: pino.Logger;
}

/**
 * Create a configurable Pino logger instance.
 * 
 * The logger uses Pino for structured logging with pretty printing in development.
 * It respects both global enable/disable settings and per-level configuration.
 * 
 * @param enable Global logging enable/disable flag
 * @param logClasses Array of log levels to enable (e.g., ['ERROR', 'WARN', 'INFO'])
 * @returns Logger factory with domain-specific child logger support
 */
export const createLogger = (enable: boolean, logClasses: string[]): LoggerFactory => {
  // Convert log classes to Pino level
  const getLogLevel = (): pino.LevelWithSilent => {
    if (!enable) return 'silent';
    
    if (logClasses.includes('TRACE')) return 'trace';
    if (logClasses.includes('DEBUG')) return 'debug';
    if (logClasses.includes('INFO')) return 'info';
    if (logClasses.includes('WARN')) return 'warn';
    if (logClasses.includes('ERROR')) return 'error';
    
    return 'silent';
  };

  // Create Pino logger with pretty printing for development
  const pinoLogger = pino({
    level: getLogLevel(),
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
  const childLoggers = new Map<LoggerDomain, Logger>();

  const createLoggerInterface = (logger: pino.Logger): Logger => ({
    error: (...params: any[]) => (logger.error as any)(...params),
    warn: (...params: any[]) => (logger.warn as any)(...params),
    info: (...params: any[]) => (logger.info as any)(...params),
    debug: (...params: any[]) => (logger.debug as any)(...params),
    trace: (...params: any[]) => (logger.trace as any)(...params),
    child: (domain: LoggerDomain) => {
      if (!childLoggers.has(domain)) {
        const childLogger = logger.child({ domain });
        childLoggers.set(domain, createLoggerInterface(childLogger));
      }
      return childLoggers.get(domain)!;
    },
    pino: logger
  });

  const rootLogger = createLoggerInterface(pinoLogger);

  // Create the factory function that also serves as the root logger
  const loggerFactory = ((domain: LoggerDomain) => {
    return rootLogger.child(domain);
  }) as LoggerFactory;

  // Copy all logger methods to the factory function
  Object.assign(loggerFactory, rootLogger);

  // Ensure the factory function also has direct pino access
  loggerFactory.pino = pinoLogger;

  return loggerFactory;
};

/**
 * @deprecated Use Logger type instead
 */
export type LoggerInstance = Logger;