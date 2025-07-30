import { Logger } from '@totallator/shared';
import { setLogger } from '@/logger';
import { type ServerEnvSchemaType } from '@totallator/shared';
import { setServerEnv } from '@/serverEnv';
import { materializedViewActions } from './actions/materializedViewActions';
import { materializedViewRefreshRateLimiter } from '@/actions/helpers/journalMaterializedView/materializedViewRefreshRateLimiter';
import type { DBType } from '@totallator/database';
import { initDBLogger } from '@/server/db/dbLogger';

type ContextType = {
	loggerInstance: Logger;
	serverEnv: ServerEnvSchemaType;
	viewRefresh: ReturnType<typeof materializedViewRefreshRateLimiter>;
	db: DBType;
	logger: Logger;
};

type InitContextType = Omit<ContextType, 'viewRefresh'>;

let context: ContextType | undefined;

export const getContext = (): ContextType => {
	if (context === undefined) {
		throw new Error('Context is not set');
	}
	return context;
};

export const initContext = (newContext: InitContextType): void => {
	const viewRefresh = materializedViewRefreshRateLimiter({
		timeout: newContext.serverEnv.VIEW_REFRESH_TIMEOUT,
		performRefresh: async () => materializedViewActions.conditionalRefresh({ db: newContext.db })
	});

	context = { ...newContext, viewRefresh };

	setLogger(newContext.loggerInstance);
	setServerEnv(newContext.serverEnv);
	initDBLogger(newContext.db);
};
