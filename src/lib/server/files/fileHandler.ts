// import fs from 'fs/promises';
import { serverEnv } from '../serverEnv';
import { FileStorage } from '@flystorage/file-storage';
import { LocalStorageAdapter } from '@flystorage/local-fs';

const fileHandler = (address: string) => {
	const adapter = new LocalStorageAdapter(address);
	return new FileStorage(adapter);
};

export const backupFileHandler = fileHandler(serverEnv.BACKUP_DIR);
export const importFileHandler = fileHandler(serverEnv.IMPORT_DIR);
