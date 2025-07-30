import { createLogger, Logger } from '@totallator/shared';

let _logger: Logger | null = null;

export const getLogger = (): Logger => {
  if (!_logger) {
    // Default configuration for business-logic package
    _logger = createLogger({
      LOGGING: true,
      LOGGING_CLASSES: ['ERROR', 'WARN', 'INFO', 'DEBUG', 'TRACE'],
    });
  }
  return _logger;
};

export const setLogger = (loggerInstance: Logger) => {
  _logger = loggerInstance;
};
