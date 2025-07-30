import { fixedDelay } from '../helpers/fixedDelay';
import { getServerEnv } from '@/serverEnv';

export const testingDelay = async () => {
	if (getServerEnv().TESTING_DELAY > 0) {
		await fixedDelay(getServerEnv().TESTING_DELAY);
	}
};

export const streamingDelay = async () => {
	await testingDelay();
	await fixedDelay(5);
};
