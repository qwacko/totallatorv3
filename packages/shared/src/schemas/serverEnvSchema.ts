import * as z from 'zod';

const parseEnvStringToBoolean = ({
	defaultBoolean = true,
	optional = true
}: { defaultBoolean?: boolean; optional?: boolean } = {}) => {
	const validation = z.stringbool();

	if (optional) {
		return validation.optional().default(defaultBoolean);
	}

	return validation.default(defaultBoolean);
};

export const serverEnvSchema = z.object({
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
	POSTGRES_MAX_CONNECTIONS: z.coerce.number<number>().optional().default(10),
	DB_QUERY_LOG: parseEnvStringToBoolean({ defaultBoolean: false, optional: true }),
	TESTING_DELAY: z.coerce.number<number>().optional().default(0),
	DISABLE_BUFFERING: parseEnvStringToBoolean({ defaultBoolean: true, optional: true }),
	TEST_ENV: parseEnvStringToBoolean({ defaultBoolean: false, optional: true }),
	IMPORT_TIMEOUT_MIN: z.coerce.number<number>().optional().default(30),
	RETENTION_MONTHS: z.coerce.number<number>().optional().default(1),
	IMPORT_RETENTION_DAYS: z.coerce.number<number>().optional().default(30),
	S3_ACCESS_KEY_ID: z.string().optional(),
	S3_SECRET_ACCESS_KEY: z.string().optional(),
	S3_ACCESS_URL: z.string().optional(),
	S3_REGION: z.string().optional(),
	S3_DISABLE_CHECKSUM: parseEnvStringToBoolean({ defaultBoolean: false, optional: true }),
	DBLOG_ENABLE: parseEnvStringToBoolean({ defaultBoolean: false, optional: true }),
	DBLOG_CACHE_SIZE: z.coerce.number<number>().optional().default(1000),
	DBLOG_CACHE_TIMEOUT: z.coerce.number<number>().optional().default(5000),
	DBLOG_STORAGE_HOURS: z.coerce.number<number>().optional().default(24),
	DBLOG_STORAGE_COUNT: z.coerce.number<number>().optional().default(100000),
	LOG_DATABASE_ADDRESS: z.string().optional().default('file:logdb.db'),
	LOG_DATABASE_KEY: z.string().optional().default('logdb'),
	TRANSACTIONLOG_ENABLE: parseEnvStringToBoolean({ defaultBoolean: false, optional: true }),
	TRANSACTIONLOG_ENABLESTART: parseEnvStringToBoolean({ defaultBoolean: false, optional: true }),
	TRANSACTIONLOG_TIME_MS: z.coerce.number<number>().optional().default(100),
	CONCURRENT_REFRESH: parseEnvStringToBoolean({ defaultBoolean: true, optional: true }),
	VIEW_REFRESH_TIMEOUT: z.coerce.number<number>().optional().default(20000),
	LLM_REVIEW_ENABLED: parseEnvStringToBoolean({ defaultBoolean: false, optional: true }),
	LLM_REVIEW_AUTO_IMPORT: parseEnvStringToBoolean({ defaultBoolean: true, optional: true }),
	LLM_REVIEW_MANUAL_CREATE: parseEnvStringToBoolean({ defaultBoolean: false, optional: true }),
	LLM_REVIEW_SCHEDULE: z.string().optional().default('*/15 * * * *'),
	LLM_AUTO_CREATE_ITEMS: parseEnvStringToBoolean({ defaultBoolean: true, optional: true }),
	ENCRYPTION_KEY: z.string().optional()
});

export type ServerEnvSchemaType = z.infer<typeof serverEnvSchema>;
