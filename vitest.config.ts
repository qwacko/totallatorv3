import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/kit/vite';

export default defineConfig({
	plugins: [svelte()],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}']
	}
});
