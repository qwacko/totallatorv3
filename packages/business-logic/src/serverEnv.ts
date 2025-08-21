import { type ServerEnvSchemaType } from '@totallator/shared';
import { getContext } from '@totallator/context';

export const getServerEnv = (): ServerEnvSchemaType => {
	const globalContext = getContext();
	return globalContext.global.serverEnv;
};
