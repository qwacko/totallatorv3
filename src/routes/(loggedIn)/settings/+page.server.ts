import { authGuard } from '$lib/authGuard/authGuardConfig.js';
import { serverEnv } from '$lib/server/serverEnv';
import cronstrue from 'cronstrue';

export const load = async (data) => {
	authGuard(data);

	const settingsToSend = {
		dev: {
			dev: serverEnv.DEV,
			devOverride: serverEnv.DEV_OVERRIDE,
			testEnv: serverEnv.TEST_ENV
		},
		configuration: {
			allowSignup: serverEnv.ALLOW_SIGNUP,
			automaticFilterSchedule: serverEnv.AUTOMATIC_FILTER_SCHEDULE,
			automaticFilterScheduleText: cronstrue.toString(serverEnv.AUTOMATIC_FILTER_SCHEDULE)
		},
		logging: {
			logging: serverEnv.LOGGING,
			debugClasses: serverEnv.LOGGING_CLASSES,
			pageTimeoutMs: serverEnv.PAGE_TIMEOUT_MS,
			queryLogging: serverEnv.DB_QUERY_LOG
		},
		dbLogging: {
			dbLogEnable: serverEnv.DBLOG_ENABLE,
			dbLogCacheSize: serverEnv.DBLOG_CACHE_SIZE,
			dbLogCacheTimeout: serverEnv.DBLOG_CACHE_TIMEOUT,
			dbLogStorageHours: serverEnv.DBLOG_STORAGE_HOURS,
			dbLogStorageCount: serverEnv.DBLOG_STORAGE_COUNT,
			transactionLogEnable: serverEnv.TRANSACTIONLOG_ENABLE,
			transactionLogEnableStart: serverEnv.TRANSACTIONLOG_ENABLESTART,
			transactionLogTimeMs: serverEnv.TRANSACTIONLOG_TIME_MS
		},
		database: {
			postgresURLPresent: !!serverEnv.POSTGRES_URL,
			postgresTestURLPresent: !!serverEnv.POSTGRES_TEST_URL,
			maxConnections: serverEnv.POSTGRES_MAX_CONNECTIONS,
			testingDelay: serverEnv.TESTING_DELAY,
			disableBuffering: serverEnv.DISABLE_BUFFERING,
			concurrentRefresh: serverEnv.CONCURRENT_REFRESH,
			viewRefreshTimeout: serverEnv.VIEW_REFRESH_TIMEOUT
		},
		storage: {
			backupDir: serverEnv.BACKUP_DIR,
			backupDirType: serverEnv.BACKUP_DIR.startsWith('s3://') ? 'S3' : 'File',
			fileDir: serverEnv.FILE_DIR,
			fileDirType: serverEnv.FILE_DIR.startsWith('s3://') ? 'S3' : 'File',
			importDir: serverEnv.IMPORT_DIR,
			importDirType: serverEnv.IMPORT_DIR.startsWith('s3://') ? 'S3' : 'File'
		},
		s3config: {
			s3AccessKeyPresent: !!serverEnv.S3_ACCESS_KEY_ID,
			s3SecretKeyPresent: !!serverEnv.S3_SECRET_ACCESS_KEY,
			s3Region: serverEnv.S3_REGION,
			s3AccessUrl: serverEnv.S3_ACCESS_URL,
			s3DisableChecksum: serverEnv.S3_DISABLE_CHECKSUM
		},
		backup: {
			backupSchedule: serverEnv.BACKUP_SCHEDULE,
			backupScheduleText: cronstrue.toString(serverEnv.BACKUP_SCHEDULE),
			retentionMonths: serverEnv.RETENTION_MONTHS
		},
		import: {
			importTimeoutMin: serverEnv.IMPORT_TIMEOUT_MIN,
			retentionDays: serverEnv.IMPORT_RETENTION_DAYS
		},
		llm: {
			llmReviewEnabled: serverEnv.LLM_REVIEW_ENABLED,
			llmReviewAutoImport: serverEnv.LLM_REVIEW_AUTO_IMPORT,
			llmReviewManualCreate: serverEnv.LLM_REVIEW_MANUAL_CREATE,
			llmReviewSchedule: serverEnv.LLM_REVIEW_SCHEDULE,
			llmReviewScheduleText: cronstrue.toString(serverEnv.LLM_REVIEW_SCHEDULE),
			llmAutoCreateItems: serverEnv.LLM_AUTO_CREATE_ITEMS
		}
	};

	return {
		settingsToSend
	};
};
