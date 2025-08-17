// import fs from 'fs/promises';
import { getServerEnv } from '@/serverEnv';
import { FileStorage } from '@flystorage/file-storage';
import { LocalStorageAdapter } from '@flystorage/local-fs';
import { S3Client } from '@aws-sdk/client-s3';
import { AwsS3StorageAdapter } from '@flystorage/aws-s3';
import { getLogger } from '@/logger';

const fileHandler = (getAddress: () => string, title: string) => {
	return () => {
		const address = getAddress();
		if (address.startsWith('s3://')) {
			const bucketAndPrefix = address.replace('s3://', '');
			const [bucket] = bucketAndPrefix.split('/');
			if (!bucket) {
				throw new Error('S3 bucket not correctly set');
			}

			const prefix = bucketAndPrefix.replace(`${bucket}/`, '');

			const s3AccessUrl = getServerEnv().S3_ACCESS_URL;
			const s3Region = getServerEnv().S3_REGION;
			const s3AccessKeyId = getServerEnv().S3_ACCESS_KEY_ID;
			const s3SecretAccessKey = getServerEnv().S3_SECRET_ACCESS_KEY;

			if (!s3AccessKeyId || !s3SecretAccessKey || !s3AccessUrl || !s3Region) {
				throw new Error('S3 environment variables not correctly set');
			}

			getLogger('files').debug({ bucket, prefix, title }, `${title} FileHandler Initiation : S3`);

			const client = new S3Client({
				requestChecksumCalculation: getServerEnv().S3_DISABLE_CHECKSUM
					? 'WHEN_REQUIRED'
					: 'WHEN_SUPPORTED',
				responseChecksumValidation: getServerEnv().S3_DISABLE_CHECKSUM
					? 'WHEN_REQUIRED'
					: 'WHEN_SUPPORTED',
				credentials: {
					accessKeyId: s3AccessKeyId,
					secretAccessKey: s3SecretAccessKey
				},
				endpoint: s3AccessUrl,
				region: s3Region
			});

			const adapter = new AwsS3StorageAdapter(client, {
				bucket,
				prefix
			});
			const storage = new FileStorage(adapter);

			return storage;
		}

		getLogger('files').debug(
			{ address, title },
			`${title} FileHandler Initiation : Local File Storage`
		);

		const adapter = new LocalStorageAdapter(address);
		return new FileStorage(adapter);
	};
};

export const backupFileHandler = fileHandler(() => getServerEnv().BACKUP_DIR, 'Backup');
export const importFileHandler = fileHandler(() => getServerEnv().IMPORT_DIR, 'Import');
export const fileFileHandler = fileHandler(() => getServerEnv().FILE_DIR, 'File');
