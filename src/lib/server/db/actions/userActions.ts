import { updateUserSchema, type updateUserSchemaType } from '$lib/schema/userSchema';
import { eq } from 'drizzle-orm';
import type { DBType } from '../db';
import { user } from '../postgres/schema/userSchema';
import type { User } from 'lucia';

export const userActions = {
	get: async ({ db, userId }: { db: DBType; userId: string }): Promise<User | undefined> => {
		const foundUser = (await db.select().from(user).where(eq(user.id, userId)).execute())[0];
		if (!foundUser) return undefined;

		const { id, ...data } = foundUser;

		return {
			userId: id,
			...data
		};
	},
	canSetAdmin: ({ userId, initiatingUser }: { userId: string; initiatingUser: User }) => {
		return initiatingUser.admin && initiatingUser.userId !== userId;
	},
	canClearAdmin: ({ userId, initiatingUser }: { userId: string; initiatingUser: User }) => {
		return initiatingUser.admin && initiatingUser.userId !== userId && initiatingUser.admin;
	},
	canUpdatePassword: ({ userId, initiatingUser }: { userId: string; initiatingUser: User }) => {
		return initiatingUser.admin || initiatingUser.userId === userId;
	},
	canUpdateInfo: ({ userId, initiatingUser }: { userId: string; initiatingUser: User }) => {
		return initiatingUser.admin || initiatingUser.userId === userId;
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
		if (initiatingUser.userId === userId) {
			throw new Error('Cannot remove admin from self');
		}

		const canClearAdmin = userActions.canClearAdmin({ userId, initiatingUser });
		if (!canClearAdmin) {
			throw new Error('Unauthorized');
		}

		await db.update(user).set({ admin: false }).where(eq(user.id, userId)).execute();
	}
};
