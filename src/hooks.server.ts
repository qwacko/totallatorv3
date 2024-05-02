import { authGuard } from '$lib/authGuard/authGuardConfig';
import { initateCronJobs } from '$lib/server/cron/cron';
import { dbNoAdmins } from '$lib/server/db/actions/firstUser';
import { logging } from '$lib/server/logging';

import { auth } from '$lib/server/lucia';
import { redirect, type Handle } from '@sveltejs/kit';

import { serverEnv } from '$lib/server/serverEnv';
import { sequence } from '@sveltejs/kit/hooks';

import { db } from '$lib/server/db/db';
import { materializedViewRefreshRateLimiter } from '$lib/server/db/actions/helpers/journalMaterializedView/materializedViewRefreshRateLimiter';
import { tActions } from '$lib/server/db/actions/tActions';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
initateCronJobs();

export const viewRefresh = materializedViewRefreshRateLimiter({
	timeout: serverEnv.VIEW_REFRESH_TIMEOUT,
	performRefresh: async () => tActions.materializedViews.conditionalRefresh({ db })
});

const handleAuth: Handle = async ({ event, resolve }) => {
	const sessionId = event.cookies.get(auth.sessionCookieName);
	if (!sessionId) {
		event.locals.user = undefined;
		event.locals.session = undefined;
		return resolve(event);
	}

	const { session, user } = await auth.validateSession(sessionId);
	if (session && session.fresh) {
		const sessionCookie = auth.createSessionCookie(session.id);
		event.cookies.set(sessionCookie.name, sessionCookie.value, {
			path: '.',
			...sessionCookie.attributes
		});
	}
	if (!session) {
		const sessionCookie = auth.createBlankSessionCookie();
		event.cookies.set(sessionCookie.name, sessionCookie.value, {
			path: '.',
			...sessionCookie.attributes
		});
	}
	event.locals.user = user || undefined;
	event.locals.session = session || undefined;
	return resolve(event);
};

const handleRoute: Handle = async ({ event, resolve }) => {
	//Update the locals to have the DB
	event.locals.db = db;

	const start = Date.now();
	const timeLimit = serverEnv.PAGE_TIMEOUT_MS;
	const timeout = setTimeout(() => {
		logging.error(`Request took longer than ${timeLimit}ms to resolve`, {
			request: event.request,
			elapsedTime: Date.now() - start,
			requestURL: event.request.url
		});
	}, timeLimit);

	const noAdmin = await dbNoAdmins(event.locals.db);

	if (!event.route.id) {
		redirect(302, '/login');
	}

	if (event.route.id === '/(loggedOut)/firstUser' && !noAdmin) {
		logging.info('Redirecting from firstUser');
		if (event.locals.user) {
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

export const handle = sequence(handleAuth, handleRoute);
