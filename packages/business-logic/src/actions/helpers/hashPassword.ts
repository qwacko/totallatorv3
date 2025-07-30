import { hash, verify } from '@node-rs/argon2';

export const hashPassword = async (password: string) => {
	return `argon2:${await hash(password, {
		memoryCost: 19456,
		timeCost: 2,
		outputLen: 32,
		parallelism: 1
	})}`;
};

export const checkHashedPassword = async (
	hashedPassword: string | null | undefined,
	password: string
): Promise<{ valid: boolean; needsRefresh: boolean }> => {
	if (!hashedPassword) {
		return { valid: false, needsRefresh: false };
	}
	if (hashedPassword.startsWith('argon2:')) {
		const valid = await verify(hashedPassword.substring(7), password);
		return { valid, needsRefresh: false };
	}
	return { valid: false, needsRefresh: false };
};
