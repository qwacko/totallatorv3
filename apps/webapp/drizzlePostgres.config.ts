import * as dotenv from 'dotenv';
import type { Config } from 'drizzle-kit';

dotenv.config();

export default {
	schema: './src/lib/server/db/postgres/schema/index.ts',
	dialect: 'postgresql',
	out: './src/lib/server/db/postgres/migrations',
	dbCredentials: {
		url: process.env.POSTGRES_URL || ''
	}
	// dbCredentials: {
	// 	database: process.env.POSTGRES_URL || ''
	// }
} satisfies Config;
