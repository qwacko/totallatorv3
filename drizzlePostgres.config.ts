import type { Config } from 'drizzle-kit';
import * as dotenv from 'dotenv';

dotenv.config();

export default {
	schema: './src/lib/server/db/postgres/schema/index.ts',
	dialect: 'postgresql',
	out: './src/lib/server/db/postgres/migrations',
	dbCredentials: {
		url: process.env.POSTGRES_URL || ''
	}
} satisfies Config;
