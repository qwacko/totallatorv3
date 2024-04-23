import { dbExecuteLogger } from '$lib/server/db/dbLogger';
import { user } from '$lib/server/db/postgres/schema';
import { redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';

export const load = async ({ params, locals }) => {
	// Fetch users from database
	const currentUser = (
		await dbExecuteLogger(
			locals.db.select().from(user).where(eq(user.id, params.id)),
			'+layout.server.ts - Get User By Id'
		)
	)[0];

	if (!currentUser) {
		redirect(302, '/users');
	}

	return { currentUser };
};
