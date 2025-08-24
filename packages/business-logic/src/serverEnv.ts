import { getContext } from '@totallator/context';
import { type ServerEnvSchemaType } from '@totallator/shared';

export const getServerEnv = (): ServerEnvSchemaType => {
	const globalContext = getContext();
	return globalContext.global.serverEnv;
};
