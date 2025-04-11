/// <reference types="vite-plugin-pwa/info" />

import 'unplugin-icons/types/svelte';

declare global {
	namespace App {
		interface Locals {
			session: import('$lib/server/db/postgres/schema/userSchema').SessionDBType | undefined;
			user: import('$lib/server/db/postgres/schema/userSchema').UserDBType | undefined;
			db: import('$lib/server/db/db').DBType;
		}
	}
}

// THIS IS IMPORTANT!!!
export {};
