import { defineConfig } from 'drizzle-kit';

export default defineConfig({
	dialect: 'turso',
	schema: './src/schema/logSchema.ts',
	out: './src/migrations',
	dbCredentials: {
		url: process.env.LOG_DATABASE_URL || 'file:./logs.db',
		authToken: process.env.LOG_DATABASE_AUTH_TOKEN
	}
});