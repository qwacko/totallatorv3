import { serverEnv } from './serverEnv';

export const testingDelay = async () => {
	if (serverEnv.TESTING_DELAY > 0) {
		await fixedDelay(serverEnv.TESTING_DELAY);
	}
};

export const fixedDelay = async (delay: number) => {
	await new Promise((resolve) => setTimeout(resolve, delay));
};
