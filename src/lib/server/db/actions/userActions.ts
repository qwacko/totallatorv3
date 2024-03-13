import { updateUserSchema, type updateUserSchemaType } from '$lib/schema/userSchema';
import { eq } from 'drizzle-orm';
import type { DBType } from '../db';
import { key, user } from '../postgres/schema/userSchema';
import type { User } from 'lucia';
import { nanoid } from 'nanoid';
import { Argon2id } from 'oslo/password';

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
		const hashedPassword = await new Argon2id().hash(password);

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
		const hashedPassword = await new Argon2id().hash(password);

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
			//Delay to avoid timing attacks
			await new Argon2id().hash(password);
			return undefined;
		}

		if (!foundUser.keys) {
			//Delay to avoid timing attacks
			await new Argon2id().hash(password);
			return undefined;
		}

		const validPassword = foundUser.keys?.hashedPassword
			? await new Argon2id().verify(password, foundUser.keys.hashedPassword)
			: false;

		if (!validPassword) {
			//Delay to avoid timing attacks
			await new Argon2id().hash(password);
			return undefined;
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
