import { LegacyScrypt } from 'lucia';
import { Argon2id } from 'oslo/password';

export const hashPassword = async (password: string) => {
	return `argon2:${await new Argon2id().hash(password)}`;
};
export const checkHashedPassword = async (
	hashedPassword: string | null | undefined,
	password: string
): Promise<{ valid: boolean; needsRefresh: boolean }> => {
	if (!hashedPassword) {
		return { valid: false, needsRefresh: false };
	}
	if (hashedPassword.startsWith('argon2:')) {
		const valid = await new Argon2id().verify(hashedPassword.substring(7), password);
		return { valid, needsRefresh: false };
	}
	if (hashedPassword.startsWith('s2:')) {
		const valid = await new LegacyScrypt().verify(hashedPassword, password);
		return { valid, needsRefresh: true };
	}
	return { valid: false, needsRefresh: false };
};
