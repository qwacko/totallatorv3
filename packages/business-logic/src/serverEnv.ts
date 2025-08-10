import { type ServerEnvSchemaType } from '@totallator/shared';
import { getGlobalContextFromStore } from '@totallator/context';

export const getServerEnv = (): ServerEnvSchemaType => {
	const globalContext = getGlobalContextFromStore();
	return globalContext.serverEnv;
};
