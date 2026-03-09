import { S3Client } from '@aws-sdk/client-s3';
import { AwsS3StorageAdapter } from '@flystorage/aws-s3';
import { FileStorage } from '@flystorage/file-storage';
import { LocalStorageAdapter } from '@flystorage/local-fs';
import { nanoid } from 'nanoid';

import type { StagedFileData } from '@totallator/bullmq';

import { serverEnv } from '../serverEnv';

const STAGING_PREFIX = '__queue_staging';

const cleanName = (name: string) => name.replace(/[^a-zA-Z0-9._-]/g, '_');

const getStorage = () => {
	const address = serverEnv.IMPORT_DIR;

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

		const client = new S3Client({
			requestChecksumCalculation: serverEnv.S3_DISABLE_CHECKSUM
				? 'WHEN_REQUIRED'
				: 'WHEN_SUPPORTED',
			responseChecksumValidation: serverEnv.S3_DISABLE_CHECKSUM
				? 'WHEN_REQUIRED'
				: 'WHEN_SUPPORTED',
			credentials: {
				accessKeyId: serverEnv.S3_ACCESS_KEY_ID,
				secretAccessKey: serverEnv.S3_SECRET_ACCESS_KEY
			},
			endpoint: serverEnv.S3_ACCESS_URL,
			region: serverEnv.S3_REGION
		});

		return new FileStorage(new AwsS3StorageAdapter(client, { bucket, prefix }));
	}

	return new FileStorage(new LocalStorageAdapter(address));
};

export const stageUploadedFile = async (file: File, idPrefix: string): Promise<StagedFileData> => {
	const storage = getStorage();
	const storageKey = `${STAGING_PREFIX}/${idPrefix}-${nanoid()}-${cleanName(file.name)}`;
	await storage.write(storageKey, Buffer.from(await file.arrayBuffer()));

	return {
		storageKey,
		originalName: file.name,
		mimeType: file.type || 'application/octet-stream'
	};
};
