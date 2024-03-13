// src/lib/server/lucia.ts
import { Lucia, TimeSpan } from 'lucia';
import { DrizzlePostgreSQLAdapter } from '@lucia-auth/adapter-drizzle';
import { dev } from '$app/environment';

import { db } from './db/db.js';
import { serverEnv } from './serverEnv.js';
import { session, user, type UserDBType } from './db/postgres/schema/userSchema.js';

const luciaEnvDev = dev || serverEnv.DEV_OVERRIDE;

const adapter = new DrizzlePostgreSQLAdapter(db, session, user);

// expect error
export const auth = new Lucia(adapter, {
	sessionExpiresIn: new TimeSpan(30, 'd'),
	sessionCookie: {
		attributes: {
			secure: !luciaEnvDev
		}
	},
	getUserAttributes: (data) => {
		return {
			id: data.id,
			username: data.username,
			admin: Boolean(data.admin),
			currencyFormat: data.currencyFormat || 'USD',
			dateFormat: data.dateFormat || 'YYYY-MM-DD',
			name: data.name
		};
	},
	getSessionAttributes: (data) => data
});

declare module 'lucia' {
	interface Register {
		Lucia: typeof auth;
		DatabaseSessionAttributes: DatabaseSessionAttributes;
		DatabaseUserAttributes: DatabaseUserAttributes;
	}
}

interface DatabaseSessionAttributes {}
interface DatabaseUserAttributes extends UserDBType {}
