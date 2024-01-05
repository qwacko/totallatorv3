import { authGuard } from '$lib/authGuard/authGuardConfig';
import { initateCronJobs } from '$lib/server/cron/cron';
import { dbNoAdmins } from '$lib/server/db/actions/firstUser';
import { logging } from '$lib/server/logging';

import { auth } from '$lib/server/lucia';
import { redirect, type Handle } from '@sveltejs/kit';
import { db } from '$lib/server/db/db';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
initateCronJobs();

export const handle: Handle = async ({ event, resolve }) => {
	const start = Date.now();
	const timeLimit = 100;
	const timeout = setTimeout(() => {
		logging.error(`Request took longer than ${timeLimit}ms to resolve`, {
			request: event.request,
			elapsedTime: Date.now() - start,
			requestURL: event.request.url
		});
	}, timeLimit);

	event.locals.auth = auth.handleRequest(event);
	event.locals.db = db;

	const [user, noAdmin] = await Promise.all([
		event.locals.auth.validate(),
		dbNoAdmins(event.locals.db)
	]);

	event.locals.user = user?.user;

	if (!event.route.id) {
		redirect(302, '/login');
	}

	if (event.route.id === '/(loggedOut)/firstUser' && !noAdmin) {
		logging.info('Redirecting from firstUser');
		if (user) {
			redirect(302, '/users');
		} else {
			redirect(302, '/login');
		}
	}

	if (event.route.id !== '/(loggedOut)/firstUser' && noAdmin) {
		redirect(302, '/firstUser');
	}

	if (event.route.id) {
		authGuard(event as Parameters<typeof authGuard>[0]);
	}

	const result = await resolve(event);

	clearTimeout(timeout);

	return result;
};
