import { createClient } from '@libsql/client';
import { redirect, type ServerInit } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { nanoid } from 'nanoid';
import path from 'path';
import { fileURLToPath } from 'url';

import {
	actionHelpers,
	clearInProgressBackupRestores,
	getEventListenerCounts,
	hasActiveBackupRestore,
	initializeEventCallbacks,
	materializedViewActions,
	tActions
} from '@totallator/business-logic';
import { noAdmins } from '@totallator/business-logic';
import {
	type CombinedContext,
	type EnhancedRequestContext,
	type GlobalContext,
	hookBuilder,
	initializeGlobalContext
} from '@totallator/context';

import { building } from '$app/environment';

import { loadConfigServer } from '$lib/routes.server.js';

import { authGuard } from './lib/authGuard/authGuardConfig.js';
import { initializeNewCronService } from './lib/server/cron/newCronService.js';
import { getServerEnv } from './lib/server/serverEnv.js';

// Set up the paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsPath = path.join(__dirname, '../../../packages/database/src/migrations');

console.log('Migrations Path:', migrationsPath);

// Create the new context system
const { hook, standaloneContext, globalContext } = hookBuilder({
	// Initialize global context with access to getContext for context-aware services
	initGlobalContext: async (
		getContext: () => CombinedContext<GlobalContext, EnhancedRequestContext>
	): Promise<GlobalContext> => {
		if (building) {
			// Return minimal context for build
			return {} as any;
		}

		console.log('Server Init Function');
		console.log('postgresUrl:', getServerEnv().POSTGRES_URL);

		const context = await initializeGlobalContext(
			{
				serverEnv: getServerEnv(),
				isBuilding: building,
				viewRefreshAction: async () => {
					return await materializedViewActions.conditionalRefreshWithContext({});
				},
				migrationsPath,
				createLoggingDBClient: () => {
					const url = getServerEnv().LOG_DATABASE_ADDRESS || 'file:logs.db';
					const authToken = getServerEnv().LOG_DATABASE_KEY;
					console.log('[hooks.server] Creating logging DB client with:', {
						url,
						hasAuthToken: !!authToken,
						authTokenLength: authToken?.length || 0
					});
					
					const client = createClient({ url, authToken });
					console.log('[hooks.server] Created client:', {
						clientExists: !!client,
						clientType: typeof client,
						clientKeys: client ? Object.keys(client).slice(0, 10) : 'no client'
					});
					
					return client;
				}
			},
			getContext
		);

		// Setup DB Logger
		actionHelpers.initDBLogger(context);

		context.logger('database').info({ title: 'New context system initialized', code: 'DB_006' });

		return context;
	},

	// Create request context with all the fields we need
	createRequestContext: (event: any): EnhancedRequestContext => {
		let clientAddress: string;
		try {
			clientAddress = event.getClientAddress();
		} catch (error) {
			// Fallback for development mode or when client address can't be determined
			clientAddress = '127.0.0.1';
		}
		
		return {
			requestId: nanoid(),
			startTime: Date.now(),
			routeId: event.route.id || event.url.pathname,
			url: event.url.pathname,
			method: event.request.method,
			user: event.locals.user,
			session: event.locals.session,
			userAgent: event.request.headers.get('user-agent') || undefined,
			ip: clientAddress
		};
	},

	// Update locals for backward compatibility
	updateLocals: (event: any, context: CombinedContext<GlobalContext, EnhancedRequestContext>) => {
		event.locals.global = context.global;
		event.locals.request = context.request;
		event.locals.db = context.global.db;
	},

	// Handle all the custom logic that was in the old hooks
	customResolve: async (context, event, resolve) => {
		// Set up timeout monitoring
		const timeLimit = context.global.serverEnv.PAGE_TIMEOUT_MS;
		const timeout = setTimeout(() => {
			context.global.logger('server').warn({
				code: 'SRV_002',
				title: `Request took longer than ${timeLimit}ms to resolve`,
				requestId: context.request.requestId,
				requestURL: event.request.url,
				routeId: event.route.id
			});
		}, timeLimit);

		try {
			// Authentication logic
			const sessionToken = event.cookies.get(tActions.auth.sessionCookieName);
			if (sessionToken) {
				const { session, user } = await tActions.auth.validateSessionToken(sessionToken);
				if (session !== null) {
					tActions.auth.setSessionTokenCookie(event, sessionToken, session.expiresAt);
				} else {
					tActions.auth.deleteSessionTokenCookie(event);
				}
				event.locals.user = user || undefined;
				event.locals.session = session || undefined;

				// Update context request with auth info
				context.request.user = user || undefined;
				context.request.session = session || undefined;
			} else {
				event.locals.user = undefined;
				event.locals.session = undefined;
			}

			// Route logic
			const noAdmin = await noAdmins({ global: context.global });

			if (event.route.id === null) {
				// Allow null route
			} else if (!event.route.id) {
				redirect(302, '/login');
			}

			if (event.route.id === '/(loggedOut)/firstUser' && !noAdmin) {
				context.global
					.logger('server')
					.info({ code: 'SRV_001', title: 'Redirecting from firstUser' });
				if (event.locals.user) {
					redirect(302, '/users');
				} else {
					redirect(302, '/login');
				}
			}

			if (event.route.id !== '/(loggedOut)/firstUser' && noAdmin) {
				redirect(302, '/firstUser');
			}

			// Check for active backup restores
			if (
				event.locals.user &&
				event.route.id &&
				!event.route.id.startsWith('/(loggedOut)') &&
				!event.route.id.includes('backup-restore-progress')
			) {
				try {
					const hasActiveRestore = await hasActiveBackupRestore();
					if (hasActiveRestore) {
						redirect(302, '/backup-restore-progress');
					}
				} catch (error) {
					if (error && typeof error === 'object' && 'status' in error && error.status === 302) {
						throw error;
					}
					context.global.logger('server').warn({
						title: 'Failed to check for active backup restore:',
						code: 'SRV_003',
						error
					});
				}
			}

			// Auth guard
			if (event.route.id) {
				authGuard(event as Parameters<typeof authGuard>[0]);
			}

			// Transaction wrapping for non-GET requests
			const isNonGetRequest = event.request.method !== 'GET';

			if (isNonGetRequest) {
				context.global.logger('database').debug({
					title: `Wrapping ${event.request.method} request in transaction`,
					code: 'DB_005',
					requestId: context.request.requestId,
					requestURL: event.request.url
				});

				return context.global.db.transaction(async () => {
					return await resolve(event);
				});
			} else {
				return resolve(event);
			}
		} finally {
			clearTimeout(timeout);
		}
	}
});

// Export for use in cron jobs and other external contexts
export { standaloneContext, globalContext };

// Server initialization - now much simpler
export const init: ServerInit = async () => {
	await loadConfigServer();

	if (building) {
		return;
	}

	// Trigger global context initialization
	await globalContext();

	// Initialize event callbacks and clear progress with a delay to ensure everything is ready
	setTimeout(async () => {
		try {
			await standaloneContext(
				{
					requestId: nanoid(),
					routeId: 'internal/init',
					url: '/internal/init',
					method: 'INIT',
					startTime: Date.now(),
					ip: '127.0.0.1'
				},
				async () => {
					console.log('Initializing event callbacks...');
					initializeEventCallbacks();
					console.log('Event callbacks initialized');

					const listenerCounts = getEventListenerCounts();
					console.log('Registered event listeners:', listenerCounts);

					console.log('Clearing in-progress backup restores...');
					await clearInProgressBackupRestores();
					console.log('Backup restore cleanup completed');
				}
			);
		} catch (error) {
			console.error('Failed to initialize event callbacks:', error);
		}
	}, 1500);

	// Initialize cron service
	setTimeout(async () => {
		try {
			await initializeNewCronService(globalContext);
		} catch (error) {
			console.error('Failed to initialize cron service:', error);
			// Retry after 5 seconds if it fails
			setTimeout(async () => {
				try {
					await initializeNewCronService(globalContext);
				} catch (retryError) {
					console.error('Failed to initialize cron service on retry:', retryError);
				}
			}, 5000);
		}
	}, 1000);
};

// Simple, clean hook sequence
export const handle = sequence(hook);
