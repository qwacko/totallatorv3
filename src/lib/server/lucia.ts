// src/lib/server/lucia.ts
import { lucia } from 'lucia';
import { sveltekit } from 'lucia/middleware';
import { dev } from '$app/environment';

import { postgresDatabase } from './db/db.js';
import { postgres } from "@lucia-auth/adapter-postgresql";
import { serverEnv } from './serverEnv.js';

const luciaEnvDev = dev || serverEnv.DEV_OVERRIDE;
const luciaCSRF = !(luciaEnvDev || !serverEnv.CSRF_CHECK_ORIGIN);

// expect error
export const auth = lucia({
	adapter: postgres(postgresDatabase, {
		key: 'user_key',
		session: 'user_session',
		user: 'user'
	}),
	env: luciaEnvDev ? 'DEV' : 'PROD',
	csrfProtection: luciaCSRF,
	middleware: sveltekit(),
	getUserAttributes: (data) => {
		return {
			username: data.username,
			admin: Boolean(data.admin),
			currencyFormat: data.currencyFormat || 'USD',
			dateFormat: data.dateFormat || 'YYYY-MM-DD',
			name: data.name
		};
	}
});

export type Auth = typeof auth;
