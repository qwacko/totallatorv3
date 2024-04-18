// import fs from 'fs/promises';
import { serverEnv } from '../serverEnv';
import { FileStorage } from '@flystorage/file-storage';
import { LocalStorageAdapter } from '@flystorage/local-fs';
import { S3Client } from '@aws-sdk/client-s3';
import { AwsS3StorageAdapter } from '@flystorage/aws-s3';
import { logging } from '../logging';

const fileHandler = (address: string, title: string) => {
	if (address.startsWith('s3://')) {
		const bucketAndPrefix = address.replace('s3://', '');
		const [bucket] = bucketAndPrefix.split('/');
		if (!bucket) {
			throw new Error('S3 bucket not correctly set');
		}
		const prefix = bucketAndPrefix.replace(`${bucket}/`, '');

		if (
			!serverEnv.S3_ACCESS_KEY_ID ||
			!serverEnv.S3_SECRET_ACCESS_KEY ||
			!serverEnv.S3_ACCESS_URL ||
			!serverEnv.S3_REGION
		) {
			throw new Error('S3 environment variables not correctly set');
		}

		logging.debug(`${title} FileHandler Initiation : S3 : Bucket = ${bucket}, Prefix = ${prefix}`);

		const client = new S3Client({
			credentials: {
				accessKeyId: serverEnv.S3_ACCESS_KEY_ID,
				secretAccessKey: serverEnv.S3_SECRET_ACCESS_KEY
			},
			endpoint: serverEnv.S3_ACCESS_URL,
			region: serverEnv.S3_REGION
		});
		const adapter = new AwsS3StorageAdapter(client, {
			bucket,
			prefix
		});
		const storage = new FileStorage(adapter);

		return storage;
	}

	logging.debug(`${title} FileHandler Initiation  : Local File Storage : Address = ${address}`);

	const adapter = new LocalStorageAdapter(address);
	return new FileStorage(adapter);
};

export const backupFileHandler = fileHandler(serverEnv.BACKUP_DIR, 'Backup');
export const importFileHandler = fileHandler(serverEnv.IMPORT_DIR, 'Import');
export const fileFileHandler = fileHandler(serverEnv.FILE_DIR, 'File');
