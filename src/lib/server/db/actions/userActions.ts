import { updateUserSchema, type updateUserSchemaType } from '$lib/schema/userSchema';
import { eq } from 'drizzle-orm';
import type { DBType } from '../db';
import { key, user } from '../postgres/schema/userSchema';
import { type User } from 'lucia';
import { nanoid } from 'nanoid';
import { fixedDelay } from '$lib/server/testingDelay';
import { hashPassword, checkHashedPassword } from './helpers/hashPassword';

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
		const foundUsers = await db
			.select()
			.from(user)
			.where(eq(user.username, username.toLowerCase()))
			.execute();

		if (foundUsers.length > 0) {
			throw new Error('User already exists');
		}

		const userId = nanoid();
		const hashedPassword = await hashPassword(password);

		await db.transaction(async (trx) => {
			await trx
				.insert(user)
				.values({
					id: userId,
					username: username.toLowerCase(),
					admin
				})
				.execute();

			await trx
				.insert(key)
				.values({
					id: nanoid(),
					userId,
					hashedPassword
				})
				.execute();
		});

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

		await db.update(key).set({ hashedPassword }).where(eq(key.userId, userId)).execute();
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
		const foundUser = await db.query.user.findFirst({
			where: (user, { eq }) => eq(user.username, username.toLowerCase()),
			with: {
				keys: true
			}
		});

		if (!foundUser) {
			//Add 200ms delay
			await fixedDelay(200);
			return undefined;
		}

		//This isn't pretty but it works. If for some reason there isn't a key then this creates a new one.
		//There shouldn't be a time that there isn't a key, but this covers that risk.
		if (!foundUser.keys) {
			await db
				.insert(key)
				.values({
					id: nanoid(),
					userId: foundUser.id,
					hashedPassword: await hashPassword(password)
				})
				.execute();
		}

		const foundUser2 = await db.query.user.findFirst({
			where: (user, { eq }) => eq(user.username, username.toLowerCase()),
			with: {
				keys: true
			}
		});

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
		await db.transaction(async (trx) => {
			await trx.delete(key).where(eq(key.userId, userId)).execute();
			await trx.delete(user).where(eq(user.id, userId)).execute();
		});
	},
	get: async ({ db, userId }: { db: DBType; userId: string }): Promise<User | undefined> => {
		const foundUser = (await db.select().from(user).where(eq(user.id, userId)).execute())[0];

		await db.delete(key).execute();
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

		await db.update(user).set(validatedInfo.data).where(eq(user.id, userId)).execute();
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

		await db.update(user).set({ admin: true }).where(eq(user.id, userId)).execute();
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

		await db.update(user).set({ admin: false }).where(eq(user.id, userId)).execute();
	}
};
