import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

import { getContextDB, runInTransactionWithLogging } from '@totallator/context';
import type { UserDBType } from '@totallator/database';
import { key, user } from '@totallator/database';
import { updateUserSchema, type updateUserSchemaType } from '@totallator/shared';

import { getLogger } from '@/logger';
import { dbExecuteLogger } from '@/server/db/dbLogger';

import { fixedDelay } from '../helpers/fixedDelay';
import { checkHashedPassword, hashPassword } from './helpers/hashPassword';

export const userActions = {
	listAll: async (): Promise<UserDBType[]> => {
		getLogger('users').debug({
			code: 'USER_010',
			title: 'Listing all users'
		});

		try {
			const db = getContextDB();
			const users = await dbExecuteLogger(db.select().from(user), 'User - List All');

			getLogger('users').info({
				code: 'USER_011',
				title: 'Successfully retrieved all users',
				userCount: users.length
			});

			return users;
		} catch (e) {
			getLogger('users').error({
				code: 'USER_012',
				title: 'Failed to list all users',
				error: e
			});
			throw e;
		}
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
		const startTime = Date.now();
		const normalizedUsername = username.toLowerCase();

		getLogger('users').info({
			code: 'USER_020',
			title: 'Creating new user',
			username: normalizedUsername,
			admin,
			passwordLength: password.length
		});

		try {
			const db = getContextDB();
			const foundUsers = await dbExecuteLogger(
				db.select().from(user).where(eq(user.username, normalizedUsername)),
				'User - Create - Check Existing'
			);

			if (foundUsers.length > 0) {
				getLogger('users').warn({
					code: 'USER_021',
					title: 'User creation failed - username already exists',
					username: normalizedUsername
				});
				throw new Error('User already exists');
			}

			getLogger('users').debug({
				code: 'USER_022',
				title: 'Username available, proceeding with user creation',
				username: normalizedUsername
			});

			const userId = nanoid();
			const hashedPassword = await hashPassword(password);

			getLogger('users').debug({
				code: 'USER_023',
				title: 'Password hashed, creating user and key records',
				userId,
				username: normalizedUsername
			});

			await runInTransactionWithLogging('Create User', async () => {
				const db = getContextDB();
				await dbExecuteLogger(
					db.insert(user).values({
						id: userId,
						username: normalizedUsername,
						admin
					}),
					'User - Create - Insert'
				);

				await dbExecuteLogger(
					db.insert(key).values({
						id: nanoid(),
						userId,
						hashedPassword
					}),
					'User - Create - Insert Key'
				);
			});

			const duration = Date.now() - startTime;
			getLogger('users').info({
				code: 'USER_024',
				title: 'User created successfully',
				userId,
				username: normalizedUsername,
				admin,
				duration
			});

			return userActions.get({ userId });
		} catch (e) {
			getLogger('users').error({
				code: 'USER_025',
				title: 'Failed to create user',
				username: normalizedUsername,
				admin,
				error: e
			});
			throw e;
		}
	},
	updatePassword: async ({
		userId,
		password
	}: {
		userId: string;
		password: string;
	}): Promise<void> => {
		const startTime = Date.now();

		getLogger('users').info({
			code: 'USER_030',
			title: 'Updating user password',
			userId,
			passwordLength: password.length
		});

		try {
			const db = getContextDB();
			const hashedPassword = await hashPassword(password);

			getLogger('users').debug({
				code: 'USER_031',
				title: 'Password hashed, updating database',
				userId
			});

			await dbExecuteLogger(
				db.update(key).set({ hashedPassword }).where(eq(key.userId, userId)),
				'User - Update Password'
			);

			const duration = Date.now() - startTime;
			getLogger('users').info({
				code: 'USER_032',
				title: 'Password updated successfully',
				userId,
				duration
			});
		} catch (e) {
			getLogger('users').error({
				code: 'USER_033',
				title: 'Failed to update password',
				userId,
				error: e
			});
			throw e;
		}
	},
	checkLogin: async ({
		username,
		password
	}: {
		username: string;
		password: string;
	}): Promise<UserDBType | undefined> => {
		const startTime = Date.now();
		const normalizedUsername = username.toLowerCase();

		getLogger('users').info({
			code: 'USER_040',
			title: 'Attempting user login',
			username: normalizedUsername
		});

		try {
			const db = getContextDB();
			const foundUser = await dbExecuteLogger(
				db.query.user.findFirst({
					where: (user, { eq }) => eq(user.username, normalizedUsername),
					with: {
						keys: true
					}
				}),
				'User - Check Login - Find User'
			);

			if (!foundUser) {
				getLogger('users').warn({
					code: 'USER_041',
					title: 'Login failed - user not found',
					username: normalizedUsername
				});
				//Add 200ms delay to prevent timing attacks
				await fixedDelay(200);
				return undefined;
			}

			getLogger('users').debug({
				code: 'USER_042',
				title: 'User found, checking authentication key',
				userId: foundUser.id,
				username: normalizedUsername,
				hasKey: !!foundUser.keys
			});

			//This isn't pretty but it works. If for some reason there isn't a key then this creates a new one.
			//There shouldn't be a time that there isn't a key, but this covers that risk.
			if (!foundUser.keys) {
				getLogger('users').warn({
					code: 'USER_043',
					title: 'No authentication key found for user, creating one',
					userId: foundUser.id,
					username: normalizedUsername
				});

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
					where: (user, { eq }) => eq(user.username, normalizedUsername),
					with: {
						keys: true
					}
				}),
				'User - Check Login - Find User 2'
			);

			if (!foundUser2) {
				getLogger('users').error({
					code: 'USER_044',
					title: 'User disappeared after key creation',
					username: normalizedUsername
				});
				//Add 200ms delay to prevent timing attacks
				await fixedDelay(200);
				return undefined;
			}

			if (!foundUser2.keys) {
				getLogger('users').error({
					code: 'USER_045',
					title: 'Authentication key still missing after creation',
					userId: foundUser2.id,
					username: normalizedUsername
				});
				//Add 200ms delay to prevent timing attacks
				await fixedDelay(200);
				return undefined;
			}

			getLogger('users').debug({
				code: 'USER_046',
				title: 'Verifying password',
				userId: foundUser2.id,
				username: normalizedUsername
			});

			const validPassword = await checkHashedPassword(foundUser2.keys.hashedPassword, password);

			if (!validPassword.valid) {
				getLogger('users').warn({
					code: 'USER_047',
					title: 'Login failed - invalid password',
					userId: foundUser2.id,
					username: normalizedUsername
				});
				//Add 200ms delay to prevent timing attacks
				await fixedDelay(200);
				return undefined;
			}

			getLogger('users').debug({
				code: 'USER_048',
				title: 'Password validation successful',
				userId: foundUser2.id,
				username: normalizedUsername,
				needsRefresh: validPassword.needsRefresh
			});

			//Updates the password to the latest format if it needs to be updated.
			if (validPassword.needsRefresh) {
				getLogger('users').info({
					code: 'USER_049',
					title: 'Upgrading password hash format',
					userId: foundUser.id,
					username: normalizedUsername
				});
				await userActions.updatePassword({ userId: foundUser.id, password });
			}

			const duration = Date.now() - startTime;
			getLogger('users').info({
				code: 'USER_050',
				title: 'User login successful',
				userId: foundUser.id,
				username: normalizedUsername,
				duration
			});

			return userActions.get({ userId: foundUser.id });
		} catch (e) {
			getLogger('users').error({
				code: 'USER_051',
				title: 'Login process failed with error',
				username: normalizedUsername,
				error: e
			});
			throw e;
		}
	},
	deleteUser: async ({ userId }: { userId: string }) => {
		const startTime = Date.now();

		getLogger('users').info({
			code: 'USER_060',
			title: 'Starting user deletion process',
			userId
		});

		try {
			// Check if user exists first
			const userToDelete = await userActions.get({ userId });
			if (!userToDelete) {
				getLogger('users').warn({
					code: 'USER_061',
					title: 'User not found for deletion',
					userId
				});
				return;
			}

			getLogger('users').debug({
				code: 'USER_062',
				title: 'User found, proceeding with deletion',
				userId,
				username: userToDelete.username,
				isAdmin: userToDelete.admin
			});

			await runInTransactionWithLogging('Delete User', async () => {
				const db = getContextDB();
				await dbExecuteLogger(db.delete(key).where(eq(key.userId, userId)), 'User - Delete - Key');
				await dbExecuteLogger(db.delete(user).where(eq(user.id, userId)), 'User - Delete - User');
			});

			const duration = Date.now() - startTime;
			getLogger('users').info({
				code: 'USER_063',
				title: 'User deleted successfully',
				userId,
				username: userToDelete.username,
				duration
			});
		} catch (e) {
			getLogger('users').error({
				code: 'USER_064',
				title: 'Failed to delete user',
				userId,
				error: e
			});
			throw e;
		}
	},
	get: async ({ userId }: { userId: string }): Promise<UserDBType | undefined> => {
		getLogger('users').trace({
			code: 'USER_070',
			title: 'Retrieving user by ID',
			userId
		});

		try {
			const db = getContextDB();
			const foundUser = (
				await dbExecuteLogger(db.select().from(user).where(eq(user.id, userId)), 'User - Get')
			)[0];

			if (!foundUser) {
				getLogger('users').debug({
					code: 'USER_071',
					title: 'User not found',
					userId
				});
				return undefined;
			}

			getLogger('users').trace({
				code: 'USER_072',
				title: 'User retrieved successfully',
				userId,
				username: foundUser.username,
				isAdmin: foundUser.admin
			});

			return foundUser;
		} catch (e) {
			getLogger('users').error({
				code: 'USER_073',
				title: 'Failed to retrieve user',
				userId,
				error: e
			});
			throw e;
		}
	},
	canSetAdmin: ({ userId, initiatingUser }: { userId: string; initiatingUser: UserDBType }) => {
		const canSet = initiatingUser.admin && initiatingUser.id !== userId;
		getLogger('users').debug({
			code: 'USER_080',
			title: 'Checking admin set permission',
			targetUserId: userId,
			initiatingUserId: initiatingUser.id,
			initiatingUserIsAdmin: initiatingUser.admin,
			isSelfRequest: initiatingUser.id === userId,
			canSetAdmin: canSet
		});
		return canSet;
	},
	canClearAdmin: ({ userId, initiatingUser }: { userId: string; initiatingUser: UserDBType }) => {
		const canClear = initiatingUser.admin && initiatingUser.id !== userId && initiatingUser.admin;
		getLogger('users').debug({
			code: 'USER_090',
			title: 'Checking admin clear permission',
			targetUserId: userId,
			initiatingUserId: initiatingUser.id,
			initiatingUserIsAdmin: initiatingUser.admin,
			isSelfRequest: initiatingUser.id === userId,
			canClearAdmin: canClear
		});
		return canClear;
	},
	canUpdatePassword: ({
		userId,
		initiatingUser
	}: {
		userId: string;
		initiatingUser: UserDBType;
	}) => {
		const canUpdate = initiatingUser.admin || initiatingUser.id === userId;
		getLogger('users').debug({
			code: 'USER_100',
			title: 'Checking password update permission',
			targetUserId: userId,
			initiatingUserId: initiatingUser.id,
			initiatingUserIsAdmin: initiatingUser.admin,
			isSelfRequest: initiatingUser.id === userId,
			canUpdatePassword: canUpdate
		});
		return canUpdate;
	},
	canUpdateInfo: ({ userId, initiatingUser }: { userId: string; initiatingUser: UserDBType }) => {
		const canUpdate = initiatingUser.admin || initiatingUser.id === userId;
		getLogger('users').debug({
			code: 'USER_110',
			title: 'Checking user info update permission',
			targetUserId: userId,
			initiatingUserId: initiatingUser.id,
			initiatingUserIsAdmin: initiatingUser.admin,
			isSelfRequest: initiatingUser.id === userId,
			canUpdateInfo: canUpdate
		});
		return canUpdate;
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
		const startTime = Date.now();

		getLogger('users').info({
			code: 'USER_120',
			title: 'Updating user information',
			targetUserId: userId,
			initiatingUserId: initiatingUser.id,
			updateFields: Object.keys(userInfo)
		});

		try {
			const db = getContextDB();
			const validatedInfo = updateUserSchema.safeParse(userInfo);

			if (!validatedInfo.success) {
				getLogger('users').warn({
					code: 'USER_121',
					title: 'Invalid user info provided for update',
					targetUserId: userId,
					initiatingUserId: initiatingUser.id,
					validationErrors: validatedInfo.error
				});
				throw new Error('Invalid user info');
			}

			const canUpdate = userActions.canUpdateInfo({ userId, initiatingUser });
			if (!canUpdate) {
				getLogger('users').warn({
					code: 'USER_122',
					title: 'Unauthorized user info update attempt',
					targetUserId: userId,
					initiatingUserId: initiatingUser.id,
					initiatingUserIsAdmin: initiatingUser.admin
				});
				throw new Error('Unauthorized');
			}

			getLogger('users').debug({
				code: 'USER_123',
				title: 'Authorization successful, updating user info',
				targetUserId: userId,
				initiatingUserId: initiatingUser.id
			});

			await dbExecuteLogger(
				db.update(user).set(validatedInfo.data).where(eq(user.id, userId)),
				'User - Update Info'
			);

			const duration = Date.now() - startTime;
			getLogger('users').info({
				code: 'USER_124',
				title: 'User information updated successfully',
				targetUserId: userId,
				initiatingUserId: initiatingUser.id,
				updateFields: Object.keys(validatedInfo.data),
				duration
			});
		} catch (e) {
			getLogger('users').error({
				code: 'USER_125',
				title: 'Failed to update user information',
				targetUserId: userId,
				initiatingUserId: initiatingUser.id,
				error: e
			});
			throw e;
		}
	},
	setAdmin: async ({ userId, initiatingUser }: { userId: string; initiatingUser: UserDBType }) => {
		const startTime = Date.now();

		getLogger('users').info({
			code: 'USER_130',
			title: 'Setting user as admin',
			targetUserId: userId,
			initiatingUserId: initiatingUser.id
		});

		try {
			const db = getContextDB();
			const canSetAdmin = userActions.canSetAdmin({ userId, initiatingUser });
			if (!canSetAdmin) {
				getLogger('users').warn({
					code: 'USER_131',
					title: 'Unauthorized admin set attempt',
					targetUserId: userId,
					initiatingUserId: initiatingUser.id,
					initiatingUserIsAdmin: initiatingUser.admin
				});
				throw new Error('Unauthorized');
			}

			// Get target user info for logging
			const targetUser = await userActions.get({ userId });

			getLogger('users').debug({
				code: 'USER_132',
				title: 'Authorization successful, granting admin privileges',
				targetUserId: userId,
				targetUsername: targetUser?.username,
				initiatingUserId: initiatingUser.id
			});

			await dbExecuteLogger(
				db.update(user).set({ admin: true }).where(eq(user.id, userId)),
				'User - Set Admin'
			);

			const duration = Date.now() - startTime;
			getLogger('users').info({
				code: 'USER_133',
				title: 'Admin privileges granted successfully',
				targetUserId: userId,
				targetUsername: targetUser?.username,
				initiatingUserId: initiatingUser.id,
				duration
			});
		} catch (e) {
			getLogger('users').error({
				code: 'USER_134',
				title: 'Failed to set admin privileges',
				targetUserId: userId,
				initiatingUserId: initiatingUser.id,
				error: e
			});
			throw e;
		}
	},
	clearAdmin: async ({
		userId,
		initiatingUser
	}: {
		userId: string;
		initiatingUser: UserDBType;
	}) => {
		const startTime = Date.now();

		getLogger('users').info({
			code: 'USER_140',
			title: 'Removing admin privileges from user',
			targetUserId: userId,
			initiatingUserId: initiatingUser.id
		});

		try {
			const db = getContextDB();
			if (initiatingUser.id === userId) {
				getLogger('users').warn({
					code: 'USER_141',
					title: 'Attempt to remove admin from self blocked',
					userId: initiatingUser.id
				});
				throw new Error('Cannot remove admin from self');
			}

			const canClearAdmin = userActions.canClearAdmin({ userId, initiatingUser });
			if (!canClearAdmin) {
				getLogger('users').warn({
					code: 'USER_142',
					title: 'Unauthorized admin clear attempt',
					targetUserId: userId,
					initiatingUserId: initiatingUser.id,
					initiatingUserIsAdmin: initiatingUser.admin
				});
				throw new Error('Unauthorized');
			}

			// Get target user info for logging
			const targetUser = await userActions.get({ userId });

			getLogger('users').debug({
				code: 'USER_143',
				title: 'Authorization successful, removing admin privileges',
				targetUserId: userId,
				targetUsername: targetUser?.username,
				initiatingUserId: initiatingUser.id
			});

			await dbExecuteLogger(
				db.update(user).set({ admin: false }).where(eq(user.id, userId)),
				'User - Clear Admin'
			);

			const duration = Date.now() - startTime;
			getLogger('users').info({
				code: 'USER_144',
				title: 'Admin privileges removed successfully',
				targetUserId: userId,
				targetUsername: targetUser?.username,
				initiatingUserId: initiatingUser.id,
				duration
			});
		} catch (e) {
			getLogger('users').error({
				code: 'USER_145',
				title: 'Failed to clear admin privileges',
				targetUserId: userId,
				initiatingUserId: initiatingUser.id,
				error: e
			});
			throw e;
		}
	}
};
