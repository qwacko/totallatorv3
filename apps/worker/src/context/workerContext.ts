import { createClient } from '@libsql/client';
import path from 'path';
import { fileURLToPath } from 'url';

import { tActions } from '@totallator/business-logic';
import {
	type CombinedContext,
	type EnhancedRequestContext,
	type GlobalContext,
	hookBuilder,
	initializeGlobalContext
} from '@totallator/context';

import { workerEnv } from '../serverEnv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsPath = path.join(__dirname, '../../../../packages/database/src/migrations');

const { standaloneContext, globalContext } = hookBuilder({
	initGlobalContext: async (
		getContext: () => CombinedContext<GlobalContext, EnhancedRequestContext>
	): Promise<GlobalContext> => {
		const context = await initializeGlobalContext(
			{
				serverEnv: workerEnv,
				isBuilding: false,
				viewRefreshAction: async () => {
					return await tActions.materializedViews.conditionalRefreshWithContext({});
				},
				migrationsPath,
				createLoggingDBClient: () => {
					const url = workerEnv.LOG_DATABASE_ADDRESS || 'file:logs.db';
					const authToken = workerEnv.LOG_DATABASE_KEY;
					return createClient({ url, authToken });
				}
			},
			getContext
		);

		return context;
	},
	createRequestContext: () => {
		return {
			requestId: 'worker',
			startTime: Date.now(),
			routeId: 'worker',
			url: '/worker',
			method: 'WORKER',
			ip: '127.0.0.1'
		} as EnhancedRequestContext;
	}
});

export { standaloneContext, globalContext };
