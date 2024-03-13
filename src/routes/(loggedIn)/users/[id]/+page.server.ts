import { authGuard } from '$lib/authGuard/authGuardConfig.js';
import { defaultJournalRedirect } from '$lib/helpers/defaultRedirect.js';
import { updateUserSchema } from '$lib/schema/userSchema.js';
import { tActions } from '$lib/server/db/actions/tActions.js';
import { user } from '$lib/server/db/postgres/schema';
import { eq } from 'drizzle-orm';
import { superValidate, message } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';

export const load = async (data) => {
	authGuard(data);

	const authUser = data.locals.user;
	if (!authUser) {
		return defaultJournalRedirect();
	}
	const targetUser = await tActions.user.get({ db: data.locals.db, userId: data.params.id });
	if (!targetUser) {
		return defaultJournalRedirect();
	}

	const form = await superValidate(targetUser, zod(updateUserSchema));

	return {
		canSetAdmin: tActions.user.canSetAdmin({ userId: data.params.id, initiatingUser: authUser }),
		canRemoveAdmin: tActions.user.canClearAdmin({
			userId: data.params.id,
			initiatingUser: authUser
		}),
		canUpdateName: tActions.user.canUpdateInfo({
			userId: data.params.id,
			initiatingUser: authUser
		}),
		canUpdatePassword: tActions.user.canUpdatePassword({
			userId: data.params.id,
			initiatingUser: authUser
		}),
		form
	};
};

export const actions = {
	updateInfo: async (data) => {
		const authUser = data.locals.user;
		if (!authUser) return;

		const form = await superValidate(data.request, zod(updateUserSchema));

		console.log('updateInforForm : ', form);

		if (!form.valid) {
			return { form };
		}

		try {
			await tActions.user.updateUserInfo({
				db: data.locals.db,
				userId: data.params.id,
				userInfo: form.data,
				initiatingUser: authUser
			});
		} catch (e) {
			console.log('updateInfoError : ', e);
			return message(form, 'Error Updating User', { status: 401 });
		}

		return { form };
	},
	setAdmin: async (data) => {
		const authUser = data.locals.user;
		if (!authUser) return;
		const targetUser = (
			await data.locals.db.select().from(user).where(eq(user.id, data.params.id)).execute()
		)[0];
		if (!targetUser) return;
		const canSetAdmin = authUser.admin && authUser.id !== targetUser.id && !targetUser.admin;

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
		const canRemoveAdmin = authUser.admin && authUser.id !== targetUser.id && targetUser.admin;
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
