import { serverEnv } from './serverEnv';

export const testingDelay = async () => {
	if (serverEnv.TESTING_DELAY > 0) {
		await new Promise((resolve) => setTimeout(resolve, serverEnv.TESTING_DELAY));
	}
};
