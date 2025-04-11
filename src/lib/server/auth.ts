import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from './db/db';
import { user, baSession, baAccount, baVerification } from './db/postgres/schema';
import { serverEnv } from './serverEnv';

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: 'pg',
		schema: {
			user: user,
			session: baSession,
			account: baAccount,
			verification: baVerification
		}
	}),
	baseURL: serverEnv.BETTER_AUTH_URL,
	secret: serverEnv.BETTER_AUTH_SECRET,
	emailAndPassword: {
		enabled: true,
		requireEmailVerification: false
	}
});
