import { serverEnvSchema, type ServerEnvSchemaType } from '@totallator/shared';

let serverEnv: ServerEnvSchemaType | undefined;

export const getServerEnv = (): ServerEnvSchemaType => {
	if (!serverEnv) {
		serverEnv = serverEnvSchema.parse({});
	}
	return serverEnv;
};

export const setServerEnv = (env: ServerEnvSchemaType) => {
	serverEnv = env;
};
