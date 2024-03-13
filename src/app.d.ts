/// <reference types="vite-plugin-pwa/info" />

import 'unplugin-icons/types/svelte';
// src/app.d.ts
/// <reference types="lucia" />
declare global {
	namespace App {
		interface Locals {
			session: import('lucia').Session | undefined;
			user: import('lucia').User | undefined;
			db: import('$lib/server/db/db').DBType;
		}
	}
}

// THIS IS IMPORTANT!!!
export {};
