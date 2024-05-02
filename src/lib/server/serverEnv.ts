import { env } from '$env/dynamic/private';
import { z } from 'zod';
import { dev } from '$app/environment';

const parseEnvStringToBoolean = ({
	defaultBoolean = true,
	optional = true
}: { defaultBoolean?: boolean; optional?: boolean } = {}) => {
	const validation = z.string().transform((data) => {
		return Boolean(JSON.parse(data));
	});
	const defaultString = defaultBoolean ? 'true' : 'false';

	if (optional) {
		return validation.optional().default(defaultString);
	}

	return validation.default(defaultString);
};

const serverEnvValidation = z.object({
	DEV: z.boolean().optional().default(false),
	LOGGING: parseEnvStringToBoolean({ defaultBoolean: true, optional: true }),
	LOGGING_CLASSES: z
		.string()
		.optional()
		.default('ERROR,WARN,INFO')
		.transform((data) => data.split(',').map((d) => d.trim().toUpperCase())),
	PAGE_TIMEOUT_MS: z.coerce
		.string()
		.optional()
		.default('1000')
		.transform((data) => parseInt(data)),
	BACKUP_DIR: z.string().optional().default('./backup'),
	IMPORT_DIR: z.string().optional().default('./import'),
	FILE_DIR: z.string().optional().default('./files'),
	BACKUP_SCHEDULE: z.string().optional().default('0 0 * * *'),
	AUTOMATIC_FILTER_SCHEDULE: z.string().optional().default('0 * * * *'),
	ALLOW_SIGNUP: parseEnvStringToBoolean({ defaultBoolean: false, optional: true }),
	DEV_OVERRIDE: parseEnvStringToBoolean({ defaultBoolean: false, optional: true }),
	POSTGRES_URL: z.string().optional(),
	POSTGRES_TEST_URL: z.string().optional(),
	POSTGRES_MAX_CONNECTIONS: z.coerce.number().optional().default(10),
	DB_QUERY_LOG: parseEnvStringToBoolean({ defaultBoolean: false, optional: true }),
	TESTING_DELAY: z.coerce.number().optional().default(0),
	DISABLE_BUFFERING: parseEnvStringToBoolean({ defaultBoolean: true, optional: true }),
	TEST_ENV: parseEnvStringToBoolean({ defaultBoolean: false, optional: true }),
	IMPORT_TIMEOUT_MIN: z.coerce.number().optional().default(30),
	RETENTION_MONTHS: z.coerce.number().optional().default(1),
	S3_ACCESS_KEY_ID: z.string().optional(),
	S3_SECRET_ACCESS_KEY: z.string().optional(),
	S3_ACCESS_URL: z.string().optional(),
	S3_REGION: z.string().optional(),
	DBLOG_ENABLE: parseEnvStringToBoolean({ defaultBoolean: false, optional: true }),
	DBLOG_CACHE_SIZE: z.coerce.number().optional().default(1000),
	DBLOG_CACHE_TIMEOUT: z.coerce.number().optional().default(5000),
	DBLOG_STORAGE_HOURS: z.coerce.number().optional().default(24),
	DBLOG_STORAGE_COUNT: z.coerce.number().optional().default(100000),
	TRANSACTIONLOG_ENABLE: parseEnvStringToBoolean({ defaultBoolean: false, optional: true }),
	TRANSACTIONLOG_ENABLESTART: parseEnvStringToBoolean({ defaultBoolean: false, optional: true }),
	TRANSACTIONLOG_TIME_MS: z.coerce.number().optional().default(100),
	CONCURRENT_REFRESH: parseEnvStringToBoolean({ defaultBoolean: true, optional: true }),
	VIEW_REFRESH_TIMEOUT: z.coerce.number().optional().default(20000)
});

export const serverEnv = serverEnvValidation.parse({
	DEV: dev,
	LOGGING: env.LOGGING,
	LOGGING_CLASSES: env.DEBUG_CLASSES,
	PAGE_TIMEOUT_MS: env.PAGE_TIMEOUT_MS,
	BACKUP_DIR: env.BACKUP_DIR,
	FILE_DIR: env.FILE_DIR,
	BACKUP_SCHEDULE: env.BACKUP_SCHEDULE,
	AUTOMATIC_FILTER_SCHEDULE: env.AUTOMATIC_FILTER_SCHEDULE,
	IMPORT_DIR: env.IMPORT_DIR,
	ALLOW_SIGNUP: env.ALLOW_SIGNUP,
	DEV_OVERRIDE: env.DEV_OVERRIDE,
	DB_QUERY_LOG: env.DB_QUERY_LOG,
	TESTING_DELAY: env.TESTING_DELAY,
	DISABLE_BUFFERING: env.DISABLE_BUFFERING,
	TEST_ENV: env.TEST_ENV,
	POSTGRES_URL: env.POSTGRES_URL,
	POSTGRES_TEST_URL: env.POSTGRES_TEST_URL,
	POSTGRES_MAX_CONNECTIONS: env.POSTGRES_MAX_CONNECTIONS,
	IMPORT_TIMEOUT_MIN: env.IMPORT_TIMEOUT_MIN,
	RETENTION_MONTHS: env.RETENTION_MONTHS,
	S3_ACCESS_KEY_ID: env.S3_ACCESS_KEY_ID,
	S3_SECRET_ACCESS_KEY: env.S3_SECRET_ACCESS_KEY,
	S3_ACCESS_URL: env.S3_ACCESS_URL,
	S3_REGION: env.S3_REGION,
	DBLOG_ENABLE: env.DBLOG_ENABLE,
	DBLOG_CACHE_SIZE: env.DBLOG_CACHE_SIZE,
	DBLOG_CACHE_TIMEOUT: env.DBLOG_CACHE_TIMEOUT,
	TRANSACTIONLOG_ENABLE: env.TRANSACTIONLOG_ENABLE,
	TRANSACTIONLOG_TIME_MS: env.TRANSACTIONLOG_TIME_MS,
	TRANSACTIONLOG_ENABLESTART: env.TRANSACTIONLOG_ENABLESTART,
	CONCURRENT_REFRESH: env.CONCURRENT_REFRESH,
	VIEW_REFRESH_TIMEOUT: env.VIEW_REFRESH_TIMEOUT
});
