import { updateUserSchema, type updateUserSchemaType } from '$lib/schema/userSchema';
import { eq } from 'drizzle-orm';
import type { DBType } from '../db';
import { key, user } from '../postgres/schema/userSchema';
import type { User } from '$lib/server/auth';
import { nanoid } from 'nanoid';
import { fixedDelay } from '$lib/fixedDelay';
import { hashPassword, checkHashedPassword } from './helpers/hashPassword';
import { dbExecuteLogger } from '../dbLogger';
import { tLogger } from '../transactionLogger';

export const userActions = {
	createUser: async ({
		db,
		username,
		password,
		admin = false
	}: {
		db: DBType;
		username: string;
		password: string;
		admin?: boolean;
	}): Promise<User | undefined> => {
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

		return userActions.get({ db, userId });
	},
	updatePassword: async ({
		db,
		userId,
		password
	}: {
		db: DBType;
		userId: string;
		password: string;
	}): Promise<void> => {
		const hashedPassword = await hashPassword(password);

		await dbExecuteLogger(
			db.update(key).set({ hashedPassword }).where(eq(key.userId, userId)),
			'User - Update Password'
		);
	},
	checkLogin: async ({
		username,
		password,
		db
	}: {
		username: string;
		password: string;
		db: DBType;
	}): Promise<User | undefined> => {
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
			await userActions.updatePassword({ db, userId: foundUser.id, password });
		}

		return userActions.get({ db, userId: foundUser.id });
	},
	deleteUser: async ({ db, userId }: { db: DBType; userId: string }) => {
		await tLogger(
			'Delete User',
			db.transaction(async (trx) => {
				await dbExecuteLogger(trx.delete(key).where(eq(key.userId, userId)), 'User - Delete - Key');
				await dbExecuteLogger(trx.delete(user).where(eq(user.id, userId)), 'User - Delete - User');
			})
		);
	},
	get: async ({ db, userId }: { db: DBType; userId: string }): Promise<User | undefined> => {
		const foundUser = (
			await dbExecuteLogger(db.select().from(user).where(eq(user.id, userId)), 'User - Get')
		)[0];

		if (!foundUser) return undefined;

		return foundUser;
	},
	canSetAdmin: ({ userId, initiatingUser }: { userId: string; initiatingUser: User }) => {
		return initiatingUser.admin && initiatingUser.id !== userId;
	},
	canClearAdmin: ({ userId, initiatingUser }: { userId: string; initiatingUser: User }) => {
		return initiatingUser.admin && initiatingUser.id !== userId && initiatingUser.admin;
	},
	canUpdatePassword: ({ userId, initiatingUser }: { userId: string; initiatingUser: User }) => {
		return initiatingUser.admin || initiatingUser.id === userId;
	},
	canUpdateInfo: ({ userId, initiatingUser }: { userId: string; initiatingUser: User }) => {
		return initiatingUser.admin || initiatingUser.id === userId;
	},

	updateUserInfo: async ({
		db,
		userId,
		userInfo,
		initiatingUser
	}: {
		db: DBType;
		userId: string;
		userInfo: updateUserSchemaType;
		initiatingUser: User;
	}) => {
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
		db,
		userId,
		initiatingUser
	}: {
		db: DBType;
		userId: string;
		initiatingUser: User;
	}) => {
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
		db,
		userId,
		initiatingUser
	}: {
		db: DBType;
		userId: string;
		initiatingUser: User;
	}) => {
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
