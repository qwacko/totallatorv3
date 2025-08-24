import { fixedDelay } from '../../../../../packages/business-logic/src/helpers/fixedDelay';
import { serverEnv } from './serverEnv';

export const testingDelay = async () => {
	if (serverEnv.TESTING_DELAY > 0) {
		await fixedDelay(serverEnv.TESTING_DELAY);
	}
};

export const streamingDelay = async () => {
	await testingDelay();
	await fixedDelay(5);
};
