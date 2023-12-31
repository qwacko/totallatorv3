/// <reference types="vite-plugin-pwa/info" />

import 'unplugin-icons/types/svelte';
// src/app.d.ts
/// <reference types="lucia" />
declare global {
	namespace App {
		interface Locals {
			auth: import('lucia').AuthRequest;
			user: import('lucia').User | undefined;
			db: import('$lib/server/db/db').DBType;
		}
	}

	namespace Lucia {
		type Auth = import('$lib/server/lucia').Auth;
		type DatabaseUserAttributes = {
			username: string;
			admin: boolean;
			name: string;
			dateFormat: import('$lib/schema/userSchema').dateFormatType;
			currencyFormat: import('$lib/schema/userSchema').currencyFormatType;
		};
		type DatabaseSessionAttributes = Record<string, never>;
	}
}

// THIS IS IMPORTANT!!!
export {};
