import { authGuard } from '$lib/authGuard/authGuardConfig';
import { initateCronJobs } from '$lib/server/cron/cron';
import { dbNoAdmins } from '$lib/server/db/actions/firstUser';
import { logging } from '$lib/server/logging';

import { auth } from '$lib/server/auth';
import { redirect, type Handle, type ServerInit } from '@sveltejs/kit';

import { serverEnv } from '$lib/server/serverEnv';
import { sequence } from '@sveltejs/kit/hooks';

import { db } from '$lib/server/db/db';
import { materializedViewRefreshRateLimiter } from '$lib/server/db/actions/helpers/journalMaterializedView/materializedViewRefreshRateLimiter';
import { tActions } from '$lib/server/db/actions/tActions';
import { building } from '$app/environment';

export let viewRefresh: undefined | ReturnType<typeof materializedViewRefreshRateLimiter> =
	undefined;

// Set Refresh Required on Startup in case there are any changes
//!building &&
//	tActions &&
//	tActions.materializedViews &&
//	tActions.materializedViews.setRefreshRequired(db);

const handleAuth: Handle = async ({ event, resolve }) => {
	const sessionToken = event.cookies.get(auth.sessionCookieName);
	if (!sessionToken) {
		event.locals.user = undefined;
		event.locals.session = undefined;
		return resolve(event);
	}

	const { session, user } = await auth.validateSessionToken(db, sessionToken);
	if (session !== null) {
		auth.setSessionTokenCookie(event, sessionToken, session.expiresAt);
	} else {
		auth.deleteSessionTokenCookie(event);
	}

	event.locals.user = user || undefined;
	event.locals.session = session || undefined;
	return resolve(event);
};

export const init: ServerInit = async () => {
	// This functionality is not required if the server is being built.
	if (building) {
		return;
	}
	console.log('Server Init Function');

	initateCronJobs();

	viewRefresh = materializedViewRefreshRateLimiter({
		timeout: serverEnv.VIEW_REFRESH_TIMEOUT,
		performRefresh: async () => tActions.materializedViews.conditionalRefresh({ db })
	});
	// tActions && tActions.materializedViews && tActions.materializedViews.setRefreshRequired(db);
};

const handleRoute: Handle = async ({ event, resolve }) => {
	//Update the locals to have the DB
	event.locals.db = db;

	const timeLimit = serverEnv.PAGE_TIMEOUT_MS;
	const timeout = setTimeout(() => {
		// logging.error(`Request took longer than ${timeLimit}ms to resolve`, {
		// 	request: event.request,
		// 	elapsedTime: Date.now() - start,
		// 	requestURL: event.request.url
		// });
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
