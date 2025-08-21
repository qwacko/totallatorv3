import { defineConfig } from 'drizzle-kit';

export default defineConfig({
	dialect: 'sqlite',
	schema: './src/schema/logSchema.ts',
	out: './src/migrations',
	dbCredentials: {
		url: process.env.LOG_DATABASE_PATH || './logs.db'
	}
});