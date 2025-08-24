import * as dotenv from 'dotenv';
import type { Config } from 'drizzle-kit';

dotenv.config();

export default {
	schema: './src/lib/server/db/schema/index.ts',
	driver: 'better-sqlite',
	out: './src/lib/server/db/migrations',
	dbCredentials: {
		url: process.env.DATABASE_FILE || ''
	}
} satisfies Config;
