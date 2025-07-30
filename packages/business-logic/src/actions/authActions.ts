import { sha256 } from '@oslojs/crypto/sha2';
import { encodeBase32LowerCaseNoPadding, encodeHexLowerCase } from '@oslojs/encoding';
import type { RequestEvent } from '@sveltejs/kit';
import { eq, gt } from 'drizzle-orm';

import {
	type SessionDBType,
	session as sessionTable,
	type UserDBType,
	user as userTable
} from '@totallator/database';
import type { DBType } from '@totallator/database';

function generateSessionToken(): string {
	const bytes = new Uint8Array(20);
	crypto.getRandomValues(bytes);
	const token = encodeBase32LowerCaseNoPadding(bytes);
	return token;
}

const SESSION_LENGTH_DAYS = 30;

async function createSession(db: DBType, token: string, userId: string): Promise<SessionDBType> {
	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
	const session: SessionDBType = {
		id: sessionId,
		userId,
		expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * SESSION_LENGTH_DAYS)
	};
	await db.insert(sessionTable).values(session);
	return session;
}

async function validateSessionToken(db: DBType, token: string): Promise<SessionValidationResult> {
	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
	const result = await db
		.select({ userData: userTable, sessionData: sessionTable })
		.from(sessionTable)
		.innerJoin(userTable, eq(sessionTable.userId, userTable.id))
		.where(eq(sessionTable.id, sessionId));

	if (result.length < 1) {
		return { session: null, user: null };
	}
	const { userData, sessionData } = result[0];
	if (Date.now() >= sessionData.expiresAt.getTime()) {
		await db.delete(sessionTable).where(eq(sessionTable.id, sessionData.id));
		return { session: null, user: null };
	}
	if (
		Date.now() >=
		sessionData.expiresAt.getTime() - 1000 * 60 * 60 * 24 * (SESSION_LENGTH_DAYS / 2)
	) {
		sessionData.expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * SESSION_LENGTH_DAYS);
		await db
			.update(sessionTable)
			.set({
				expiresAt: sessionData.expiresAt
			})
			.where(eq(sessionTable.id, sessionData.id));
	}
	return { session: sessionData, user: userData };
}

async function invalidateSession(db: DBType, sessionId: string): Promise<void> {
	await db.delete(sessionTable).where(eq(sessionTable.id, sessionId));
}

async function invalidateAllSessions(db: DBType, userId: string): Promise<void> {
	await db.delete(sessionTable).where(eq(sessionTable.userId, userId));
}

async function deleteExpiredSessions(db: DBType): Promise<void> {
	const now = new Date(Date.now());
	await db.delete(sessionTable).where(gt(sessionTable.expiresAt, now));
}

type SessionValidationResult =
	| { session: SessionDBType; user: UserDBType }
	| { session: null; user: null };

const SESSION_COOKIE_NAME = 'session';

function setSessionTokenCookie(event: RequestEvent, token: string, expiresAt: Date): void {
	event.cookies.set(SESSION_COOKIE_NAME, token, {
		httpOnly: true,
		sameSite: 'lax',
		expires: expiresAt,
		path: '/'
	});
}

function deleteSessionTokenCookie(event: RequestEvent): void {
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
