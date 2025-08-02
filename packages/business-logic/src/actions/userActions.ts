import { updateUserSchema, type updateUserSchemaType } from '@totallator/shared';
import { eq } from 'drizzle-orm';
import type { UserDBType } from '@totallator/database';
import { key, user } from '@totallator/database';
import { nanoid } from 'nanoid';
import { fixedDelay } from '../helpers/fixedDelay';
import { hashPassword, checkHashedPassword } from './helpers/hashPassword';
import { dbExecuteLogger } from '@/server/db/dbLogger';
import { tLogger } from '../server/db/transactionLogger';
import { getContextDB } from '@totallator/context';

export const userActions = {
	listAll: async (): Promise<UserDBType[]> => {
		const db = getContextDB();
		const users = await dbExecuteLogger(db.select().from(user), 'User - List All');
		return users;
	},
	createUser: async ({
		username,
		password,
		admin = false
	}: {
		username: string;
		password: string;
		admin?: boolean;
	}): Promise<UserDBType | undefined> => {
		const db = getContextDB();
		const foundUsers = await dbExecuteLogger(
			db.select().from(user).where(eq(user.username, username.toLowerCase())),
			'User - Create - Check Existing'
		);

		if (foundUsers.length > 0) {
			throw new Error('User already exists');
		}

		const userId = nanoid();
		const hashedPassword = await hashPassword(password);

		await tLogger(
			'Create User',
			db.transaction(async (trx) => {
				await dbExecuteLogger(
					trx.insert(user).values({
						id: userId,
						username: username.toLowerCase(),
						admin
					}),
					'User - Create - Insert'
				);

				await dbExecuteLogger(
					trx.insert(key).values({
						id: nanoid(),
						userId,
						hashedPassword
					}),
					'User - Create - Insert Key'
				);
			})
		);

		return userActions.get({ userId });
	},
	updatePassword: async ({
		userId,
		password
	}: {
		userId: string;
		password: string;
	}): Promise<void> => {
		const db = getContextDB();
		const hashedPassword = await hashPassword(password);

		await dbExecuteLogger(
			db.update(key).set({ hashedPassword }).where(eq(key.userId, userId)),
			'User - Update Password'
		);
	},
	checkLogin: async ({
		username,
		password
	}: {
		username: string;
		password: string;
	}): Promise<UserDBType | undefined> => {
		const db = getContextDB();
		const foundUser = await dbExecuteLogger(
			db.query.user.findFirst({
				where: (user, { eq }) => eq(user.username, username.toLowerCase()),
				with: {
					keys: true
				}
			}),
			'User - Check Login - Find User'
		);

		if (!foundUser) {
			//Add 200ms delay
			await fixedDelay(200);
			return undefined;
		}

		//This isn't pretty but it works. If for some reason there isn't a key then this creates a new one.
		//There shouldn't be a time that there isn't a key, but this covers that risk.
		if (!foundUser.keys) {
			await dbExecuteLogger(
				db.insert(key).values({
					id: nanoid(),
					userId: foundUser.id,
					hashedPassword: await hashPassword(password)
				}),
				'User - Check Login - Insert Key'
			);
		}

		const foundUser2 = await dbExecuteLogger(
			db.query.user.findFirst({
				where: (user, { eq }) => eq(user.username, username.toLowerCase()),
				with: {
					keys: true
				}
			}),
			'User - Check Login - Find User 2'
		);

		if (!foundUser2) {
			//Add 200ms delay
			await fixedDelay(200);
			return undefined;
		}

		if (!foundUser2.keys) {
			//Add 200ms delay
			await fixedDelay(200);
			return undefined;
		}

		const validPassword = await checkHashedPassword(foundUser2.keys.hashedPassword, password);

		if (!validPassword.valid) {
			//Add 200ms delay
			await fixedDelay(200);
			return undefined;
		}

		//Updates the password to the latest format if it needs to be updated.
		if (validPassword.needsRefresh) {
			await userActions.updatePassword({ userId: foundUser.id, password });
		}

		return userActions.get({ userId: foundUser.id });
	},
	deleteUser: async ({ userId }: { userId: string }) => {
		const db = getContextDB();
		await tLogger(
			'Delete User',
			db.transaction(async (trx) => {
				await dbExecuteLogger(trx.delete(key).where(eq(key.userId, userId)), 'User - Delete - Key');
				await dbExecuteLogger(trx.delete(user).where(eq(user.id, userId)), 'User - Delete - User');
			})
		);
	},
	get: async ({ userId }: { userId: string }): Promise<UserDBType | undefined> => {
		const db = getContextDB();
		const foundUser = (
			await dbExecuteLogger(db.select().from(user).where(eq(user.id, userId)), 'User - Get')
		)[0];

		if (!foundUser) return undefined;

		return foundUser;
	},
	canSetAdmin: ({ userId, initiatingUser }: { userId: string; initiatingUser: UserDBType }) => {
		return initiatingUser.admin && initiatingUser.id !== userId;
	},
	canClearAdmin: ({ userId, initiatingUser }: { userId: string; initiatingUser: UserDBType }) => {
		return initiatingUser.admin && initiatingUser.id !== userId && initiatingUser.admin;
	},
	canUpdatePassword: ({
		userId,
		initiatingUser
	}: {
		userId: string;
		initiatingUser: UserDBType;
	}) => {
		return initiatingUser.admin || initiatingUser.id === userId;
	},
	canUpdateInfo: ({ userId, initiatingUser }: { userId: string; initiatingUser: UserDBType }) => {
		return initiatingUser.admin || initiatingUser.id === userId;
	},

	updateUserInfo: async ({
		userId,
		userInfo,
		initiatingUser
	}: {
		userId: string;
		userInfo: updateUserSchemaType;
		initiatingUser: UserDBType;
	}) => {
		const db = getContextDB();
		const validatedInfo = updateUserSchema.safeParse(userInfo);

		if (!validatedInfo.success) {
			throw new Error('Invalid user info');
		}

		const canUpdate = userActions.canUpdateInfo({ userId, initiatingUser });
		if (!canUpdate) {
			throw new Error('Unauthorized');
		}

		await dbExecuteLogger(
			db.update(user).set(validatedInfo.data).where(eq(user.id, userId)),
			'User - Update Info'
		);
	},
	setAdmin: async ({
		userId,
		initiatingUser
	}: {
		userId: string;
		initiatingUser: UserDBType;
	}) => {
		const db = getContextDB();
		const canSetAdmin = userActions.canSetAdmin({ userId, initiatingUser });
		if (!canSetAdmin) {
			throw new Error('Unauthorized');
		}

		await dbExecuteLogger(
			db.update(user).set({ admin: true }).where(eq(user.id, userId)),
			'User - Set Admin'
		);
	},
	clearAdmin: async ({
		userId,
		initiatingUser
	}: {
		userId: string;
		initiatingUser: UserDBType;
	}) => {
		const db = getContextDB();
		if (initiatingUser.id === userId) {
			throw new Error('Cannot remove admin from self');
		}

		const canClearAdmin = userActions.canClearAdmin({ userId, initiatingUser });
		if (!canClearAdmin) {
			throw new Error('Unauthorized');
		}

		await dbExecuteLogger(
			db.update(user).set({ admin: false }).where(eq(user.id, userId)),
			'User - Clear Admin'
		);
	}
};
