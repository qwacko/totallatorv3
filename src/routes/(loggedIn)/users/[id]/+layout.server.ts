import { db } from '$lib/server/db/db';
import { user } from '$lib/server/db/postgres/schema';
import { redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';

export const load = async ({ params }) => {
	// Fetch users from database
	const currentUser = (await db.select().from(user).where(eq(user.id, params.id)).execute())[0];

	if (!currentUser) {
		redirect(302, '/users');
	}

	return { currentUser };
};
