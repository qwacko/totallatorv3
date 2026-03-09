import { S3Client } from '@aws-sdk/client-s3';
import { AwsS3StorageAdapter } from '@flystorage/aws-s3';
import { FileStorage } from '@flystorage/file-storage';
import { LocalStorageAdapter } from '@flystorage/local-fs';

import type { StagedFileData } from '@totallator/bullmq';

import { workerEnv } from '../serverEnv';

const STAGING_PREFIX = '__queue_staging';

const getStorage = () => {
	const address = workerEnv.IMPORT_DIR;

	if (address.startsWith('s3://')) {
		const bucketAndPrefix = address.replace('s3://', '');
		const [bucket] = bucketAndPrefix.split('/');
		if (!bucket) {
			throw new Error('S3 bucket not correctly set');
		}

		const prefix = bucketAndPrefix.replace(`${bucket}/`, '');

		if (
			!workerEnv.S3_ACCESS_KEY_ID ||
			!workerEnv.S3_SECRET_ACCESS_KEY ||
			!workerEnv.S3_ACCESS_URL ||
			!workerEnv.S3_REGION
		) {
			throw new Error('S3 environment variables not correctly set');
		}

		const client = new S3Client({
			requestChecksumCalculation: workerEnv.S3_DISABLE_CHECKSUM
				? 'WHEN_REQUIRED'
				: 'WHEN_SUPPORTED',
			responseChecksumValidation: workerEnv.S3_DISABLE_CHECKSUM
				? 'WHEN_REQUIRED'
				: 'WHEN_SUPPORTED',
			credentials: {
				accessKeyId: workerEnv.S3_ACCESS_KEY_ID,
				secretAccessKey: workerEnv.S3_SECRET_ACCESS_KEY
			},
			endpoint: workerEnv.S3_ACCESS_URL,
			region: workerEnv.S3_REGION
		});

		return new FileStorage(new AwsS3StorageAdapter(client, { bucket, prefix }));
	}

	return new FileStorage(new LocalStorageAdapter(address));
};

export const readStagedFile = async (file: StagedFileData) => {
	const storage = getStorage();
	const data = await storage.readToBuffer(file.storageKey);
	return new File([data], file.originalName, { type: file.mimeType });
};

export const cleanupStagedFile = async (file: StagedFileData) => {
	const storage = getStorage();
	await storage.deleteFile(file.storageKey);
};
