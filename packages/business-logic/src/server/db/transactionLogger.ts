import { getLogger } from '@/logger';
import { getServerEnv } from '@/serverEnv';

export const tLogger = async <T>(title: string, query: Promise<T>) => {
	const transactionLoggingThreshold = getServerEnv().TRANSACTIONLOG_TIME_MS;
	const enableTransactionLogging = getServerEnv().TRANSACTIONLOG_ENABLE;
	const enableTransactionStartLogging = getServerEnv().TRANSACTIONLOG_ENABLESTART;
	if (!enableTransactionLogging) return query;
	const start = Date.now();
	if (enableTransactionStartLogging) {
		getLogger('database').info({
			code: 'DB_001',
			title: `Transaction "${title}" started`
		});
	}
	try {
		const result = await query;
		const duration = Date.now() - start;
		if (duration > transactionLoggingThreshold)
			getLogger('database').info({
				code: 'DB_002',
				title: `Transaction "${title}" took ${duration}ms`,
				duration
			});
		return result;
	} catch (err) {
		const duration = Date.now() - start;
		getLogger('database').error({
			code: 'DB_003',
			title: `Transaction "${title}" failed after ${duration}ms`,
			err,
			duration
		});
		throw err;
	}
};
