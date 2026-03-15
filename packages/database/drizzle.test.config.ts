import { defineConfig } from 'drizzle-kit';

export default defineConfig({
	dialect: 'postgresql',
	schema: './src/schema/index.ts',
	out: './src/test-migrations',
	dbCredentials: {
		url: 'postgres://localhost:5432/totallator_test'
	}
});
