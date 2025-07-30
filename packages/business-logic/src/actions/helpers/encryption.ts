import * as crypto from 'crypto';
import { getServerEnv } from '@/serverEnv';

const ALGORITHM = 'aes-256-cbc';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;

// Get encryption key from environment or generate a default (not secure for production)
const getEncryptionKey = (): Buffer => {
	const key = getServerEnv().ENCRYPTION_KEY || undefined;

	if (key) {
		return Buffer.from(key, 'hex');
	}
	// Default key for development - this should be set in production!
	console.warn(
		'Using default encryption key. Set ENCRYPTION_KEY environment variable in production!'
	);
	return crypto.scryptSync('totallator-default-key', 'salt', KEY_LENGTH);
};

export const encryptText = (text: string): string => {
	const key = getEncryptionKey();
	const iv = crypto.randomBytes(IV_LENGTH);
	const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

	let encrypted = cipher.update(text, 'utf8', 'hex');
	encrypted += cipher.final('hex');

	// Return: iv + encrypted (all hex encoded)
	return iv.toString('hex') + encrypted;
};

export const decryptText = (encryptedData: string): string => {
	const key = getEncryptionKey();

	// Extract components
	const iv = Buffer.from(encryptedData.slice(0, IV_LENGTH * 2), 'hex');
	const encrypted = encryptedData.slice(IV_LENGTH * 2);

	const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

	let decrypted = decipher.update(encrypted, 'hex', 'utf8');
	decrypted += decipher.final('utf8');

	return decrypted;
};
