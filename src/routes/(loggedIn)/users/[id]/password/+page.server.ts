import { updatePasswordSchema } from '$lib/schema/updatePasswordSchema.js';
import { authGuard } from '$lib/authGuard/authGuardConfig.js';
import { user } from '$lib/server/db/postgres/schema';
import { redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { message, superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { userActions } from '$lib/server/db/actions/userActions.js';
import { dbExecuteLogger } from '$lib/server/db/dbLogger';

const passwordSchema = updatePasswordSchema;

export type passwordSchemaType = typeof passwordSchema;

export const load = async (requestData) => {
	authGuard(requestData);

	const form = await superValidate(zod(passwordSchema));

	return { form };
};

const passwordSchemaRefined = passwordSchema.refine(
	(data) => data.password === data.confirmPassword,
	{
		message: 'Passwords do not match',
		path: ['confirmPassword']
	}
);

export const actions = {
	default: async ({ locals, params, request }) => {
		const form = await superValidate(request, zod(passwordSchemaRefined));
		const currentUser = locals.user;
		const targetUserId = params.id;

		if (!form.valid) {
			return { form };
		}

		//Admin Cannot Do This
		if (!currentUser) {
			return message(form, "You're not logged in");
		}

		if (!(currentUser.id === targetUserId) && !currentUser.admin) {
			return message(form, "You're not allowed to do this");
		}

		const targetUser = (
			await dbExecuteLogger(
				locals.db.select().from(user).where(eq(user.id, targetUserId)),
				'Get User By Id'
			)
		)[0];

		if (!targetUser) {
			return message(form, 'User Not Found');
		}

		try {
			await userActions.updatePassword({
				db: locals.db,
				userId: targetUserId,
				password: form.data.password
			});
		} catch (e) {
			return message(form, 'Error Updating Password', { status: 400 });
		}

		redirect(302, `/users/${targetUserId}`);
	}
};
