import { authGuard } from '$lib/authGuard/authGuardConfig.js';
import { user } from '$lib/server/db/postgres/schema';
import { eq } from 'drizzle-orm';

export const load = async (data) => {
	authGuard(data);

	const authUser = data.locals.user;
	if (!authUser) return;
	const targetUser = (
		await data.locals.db.select().from(user).where(eq(user.id, data.params.id)).execute()
	)[0];
	if (!targetUser) return;

	return {
		canSetAdmin: authUser.admin && authUser.userId !== targetUser.id && !targetUser.admin,
		canRemoveAdmin: authUser.admin && authUser.userId !== targetUser.id && targetUser.admin,
		canUpdateName: authUser.admin || authUser.userId === targetUser.id,
		canUpdatePassword: authUser.admin || authUser.userId === targetUser.id
	};
};

export const actions = {
	updateName: async (data) => {
		const authUser = data.locals.user;
		if (!authUser) return;
		const targetUser = (
			await data.locals.db.select().from(user).where(eq(user.id, data.params.id)).execute()
		)[0];
		if (!targetUser) return;
		const canUpdateName = authUser.admin || authUser.userId === targetUser.id;

		if (!canUpdateName) {
			return;
		}

		const formData = await data.request.formData();
		const name = formData.get('name')?.toString();

		if (!name) {
			return;
		}

		const currentUser = await data.locals.db
			.select()
			.from(user)
			.where(eq(user.id, data.params.id))
			.execute();
		if (!currentUser || !(currentUser.length === 1)) {
			return;
		}
		if (currentUser[0].name === name) {
			return;
		}

		await data.locals.db.update(user).set({ name }).where(eq(user.id, data.params.id)).execute();

		return;
	},
	setAdmin: async (data) => {
		const authUser = data.locals.user;
		if (!authUser) return;
		const targetUser = (
			await data.locals.db.select().from(user).where(eq(user.id, data.params.id)).execute()
		)[0];
		if (!targetUser) return;
		const canSetAdmin = authUser.admin && authUser.userId !== targetUser.id && !targetUser.admin;

		if (!canSetAdmin) {
			return;
		}

		await data.locals.db
			.update(user)
			.set({ admin: true })
			.where(eq(user.id, data.params.id))
			.execute();

		return;
	},
	removeAdmin: async (data) => {
		const authUser = data.locals.user;
		if (!authUser) return;
		const targetUser = (
			await data.locals.db.select().from(user).where(eq(user.id, data.params.id)).execute()
		)[0];
		if (!targetUser) return;
		const canRemoveAdmin = authUser.admin && authUser.userId !== targetUser.id && targetUser.admin;
		if (!canRemoveAdmin) {
			return;
		}

		await data.locals.db
			.update(user)
			.set({ admin: false })
			.where(eq(user.id, data.params.id))
			.execute();

		return;
	}
};
