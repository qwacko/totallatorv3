import { updatePasswordSchema } from '$lib/schema/updatePasswordSchema.js';
import { authGuard } from '$lib/authGuard/authGuardConfig.js';
import { user } from '$lib/server/db/postgres/schema';
import { auth } from '$lib/server/lucia.js';
import { redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { message, superValidate } from 'sveltekit-superforms/server';

const passwordSchema = updatePasswordSchema;

export type passwordSchemaType = typeof passwordSchema;

export const load = async (requestData) => {
	authGuard(requestData);

	const form = await superValidate(passwordSchema);

	return { form };
};

export const actions = {
	default: async ({ locals, params, request }) => {
		const form = await superValidate(
			request,
			passwordSchema.refine((data) => data.password === data.confirmPassword, {
				message: 'Passwords do not match',
				path: ['confirmPassword']
			})
		);
		const currentUser = locals.user;
		const targetUserId = params.id;

		if (!form.valid) {
			return { form };
		}

		//Admin Cannot Do This
		if (!currentUser) {
			return message(form, "You're not logged in");
		}

		if (!(currentUser.userId === targetUserId) && !currentUser.admin) {
			return message(form, "You're not allowed to do this");
		}

		const targetUser = (
			await locals.db.select().from(user).where(eq(user.id, targetUserId)).execute()
		)[0];

		if (!targetUser) {
			return message(form, 'User Not Found');
		}

		try {
			await auth.updateKeyPassword(
				'username',
				targetUser.username.toLowerCase(),
				form.data.password
			);
		} catch (e) {
			return message(form, 'Error Updating Password', { status: 400 });
		}

		redirect(302, `/users/${targetUserId}`);
	}
};
