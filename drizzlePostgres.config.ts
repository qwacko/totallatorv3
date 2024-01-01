import type { Config } from 'drizzle-kit';
import * as dotenv from 'dotenv';

dotenv.config();

export default {
	schema: './src/lib/server/db/postgres/schema/index.ts',
	driver: 'pg',
	out: './src/lib/server/db/postgres/migrations',
	dbCredentials: {
		connectionString: process.env.POSTGRES_URL || ''
	}
} satisfies Config;
