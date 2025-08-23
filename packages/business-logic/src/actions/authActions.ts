import { sha256 } from '@oslojs/crypto/sha2';
import { encodeBase32LowerCaseNoPadding, encodeHexLowerCase } from '@oslojs/encoding';
import type { RequestEvent } from '@sveltejs/kit';
import { eq, gt } from 'drizzle-orm';

import { getContextDB } from '@totallator/context';
import {
	type SessionDBType,
	session as sessionTable,
	type UserDBType,
	user as userTable
} from '@totallator/database';

import { getLogger } from '@/logger';

function generateSessionToken(): string {
	const bytes = new Uint8Array(20);
	crypto.getRandomValues(bytes);
	const token = encodeBase32LowerCaseNoPadding(bytes);
	return token;
}

const SESSION_LENGTH_DAYS = 30;

async function createSession(token: string, userId: string): Promise<SessionDBType> {
	const db = getContextDB();
	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
	const session: SessionDBType = {
		id: sessionId,
		userId,
		expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * SESSION_LENGTH_DAYS)
	};

	getLogger('auth').info({
		code: 'AUTH_010',
		title: 'Creating new session',
		userId,
		sessionId,
		expiresAt: session.expiresAt
	});

	try {
		await db.insert(sessionTable).values(session);
		getLogger('auth').info({
			code: 'AUTH_011',
			title: 'Session created successfully',
			userId,
			sessionId
		});
		return session;
	} catch (e) {
		getLogger('auth').error({
			code: 'AUTH_012',
			title: 'Failed to create session',
			userId,
			sessionId,
			error: e
		});
		throw e;
	}
}

async function validateSessionToken(token: string): Promise<SessionValidationResult> {
	const db = getContextDB();
	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));

	getLogger('auth').trace({
		code: 'AUTH_020',
		title: 'Validating session token',
		sessionId
	});

	try {
		const result = await db
			.select({ userData: userTable, sessionData: sessionTable })
			.from(sessionTable)
			.innerJoin(userTable, eq(sessionTable.userId, userTable.id))
			.where(eq(sessionTable.id, sessionId));

		if (result.length < 1) {
			getLogger('auth').debug({
				code: 'AUTH_021',
				title: 'Session not found in database',
				sessionId
			});
			return { session: null, user: null };
		}

		const { userData, sessionData } = result[0];

		if (Date.now() >= sessionData.expiresAt.getTime()) {
			getLogger('auth').info({
				code: 'AUTH_022',
				title: 'Session expired, deleting',
				userId: userData.id,
				sessionId,
				expiredAt: sessionData.expiresAt
			});
			await db.delete(sessionTable).where(eq(sessionTable.id, sessionData.id));
			return { session: null, user: null };
		}

		if (
			Date.now() >=
			sessionData.expiresAt.getTime() - 1000 * 60 * 60 * 24 * (SESSION_LENGTH_DAYS / 2)
		) {
			getLogger('auth').debug({
				code: 'AUTH_023',
				title: 'Extending session expiration',
				userId: userData.id,
				sessionId,
				oldExpiry: sessionData.expiresAt
			});

			sessionData.expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * SESSION_LENGTH_DAYS);
			await db
				.update(sessionTable)
				.set({
					expiresAt: sessionData.expiresAt
				})
				.where(eq(sessionTable.id, sessionData.id));

			getLogger('auth').debug({
				code: 'AUTH_024',
				title: 'Session expiration extended',
				userId: userData.id,
				sessionId,
				newExpiry: sessionData.expiresAt
			});
		}

		getLogger('auth').trace({
			code: 'AUTH_025',
			title: 'Session validation successful',
			userId: userData.id,
			sessionId
		});

		return { session: sessionData, user: userData };
	} catch (e) {
		getLogger('auth').error({
			code: 'AUTH_026',
			title: 'Error during session validation',
			sessionId,
			error: e
		});
		throw e;
	}
}

async function invalidateSession(sessionId: string): Promise<void> {
	const db = getContextDB();

	getLogger('auth').info({
		code: 'AUTH_030',
		title: 'Invalidating session',
		sessionId
	});

	try {
		await db.delete(sessionTable).where(eq(sessionTable.id, sessionId));
		getLogger('auth').info({
			code: 'AUTH_031',
			title: 'Session invalidated successfully',
			sessionId
		});
	} catch (e) {
		getLogger('auth').error({
			code: 'AUTH_032',
			title: 'Failed to invalidate session',
			sessionId,
			error: e
		});
		throw e;
	}
}

async function invalidateAllSessions(userId: string): Promise<void> {
	const db = getContextDB();

	getLogger('auth').info({
		code: 'AUTH_040',
		title: 'Invalidating all sessions for user',
		userId
	});

	try {
		// First count sessions to be deleted for logging
		const sessionsToDelete = await db
			.select({ count: sessionTable.id })
			.from(sessionTable)
			.where(eq(sessionTable.userId, userId));

		getLogger('auth').debug({
			code: 'AUTH_041',
			title: 'Found sessions to delete',
			userId,
			sessionCount: sessionsToDelete.length
		});

		await db.delete(sessionTable).where(eq(sessionTable.userId, userId));

		getLogger('auth').info({
			code: 'AUTH_042',
			title: 'All user sessions invalidated successfully',
			userId,
			sessionCount: sessionsToDelete.length
		});
	} catch (e) {
		getLogger('auth').error({
			code: 'AUTH_043',
			title: 'Failed to invalidate all user sessions',
			userId,
			error: e
		});
		throw e;
	}
}

async function deleteExpiredSessions(): Promise<void> {
	const db = getContextDB();
	const now = new Date(Date.now());

	getLogger('auth').debug({
		code: 'AUTH_050',
		title: 'Cleaning up expired sessions',
		currentTime: now
	});

	try {
		// First count expired sessions
		const expiredSessions = await db
			.select({ count: sessionTable.id })
			.from(sessionTable)
			.where(gt(sessionTable.expiresAt, now));

		await db.delete(sessionTable).where(gt(sessionTable.expiresAt, now));

		if (expiredSessions.length > 0) {
			getLogger('auth').info({
				code: 'AUTH_051',
				title: 'Expired sessions cleaned up',
				expiredSessionCount: expiredSessions.length
			});
		} else {
			getLogger('auth').debug({
				code: 'AUTH_052',
				title: 'No expired sessions found to clean up'
			});
		}
	} catch (e) {
		getLogger('auth').error({
			code: 'AUTH_053',
			title: 'Failed to delete expired sessions',
			error: e
		});
		throw e;
	}
}

type SessionValidationResult =
	| { session: SessionDBType; user: UserDBType }
	| { session: null; user: null };

const SESSION_COOKIE_NAME = 'session';

function setSessionTokenCookie(event: RequestEvent, token: string, expiresAt: Date): void {
	getLogger('auth').trace({
		code: 'AUTH_060',
		title: 'Setting session cookie',
		expiresAt
	});

	event.cookies.set(SESSION_COOKIE_NAME, token, {
		httpOnly: true,
		sameSite: 'lax',
		expires: expiresAt,
		path: '/'
	});
}

function deleteSessionTokenCookie(event: RequestEvent): void {
	getLogger('auth').info({
		code: 'AUTH_070',
		title: 'Deleting session cookie'
	});

	event.cookies.set(SESSION_COOKIE_NAME, '', {
		httpOnly: true,
		sameSite: 'lax',
		maxAge: 0,
		path: '/'
	});
}

export const auth = {
	createSession,
	validateSessionToken,
	invalidateSession,
	invalidateAllSessions,
	deleteExpiredSessions,
	generateSessionToken,
	setSessionTokenCookie,
	deleteSessionTokenCookie,
	sessionCookieName: SESSION_COOKIE_NAME
};
