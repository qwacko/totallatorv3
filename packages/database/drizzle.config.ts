import { defineConfig } from 'drizzle-kit';

export default defineConfig({
	dialect: 'postgresql',
	schema: './src/schema/index.ts',
	out: './src/migrations',
	dbCredentials: {
		url: process.env.POSTGRES_URL || 'postgres://localhost:5432/totallator'
	}
});
