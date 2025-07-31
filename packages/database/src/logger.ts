import { getLogger as createLogger, type LoggerType } from '@totallator/shared';

let _logger: LoggerType | null = null;

export const getLogger = (): LoggerType => {
  if (!_logger) {
    // Default configuration for database package
    _logger = createLogger(true, ['ERROR', 'WARN', 'INFO', 'DEBUG', 'TRACE']);
  }
  return _logger;
};

export const setLogger = (loggerInstance: LoggerType) => {
  _logger = loggerInstance;
};
