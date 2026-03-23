import { getEventEmitter } from '@totallator/context';

import { publishRealtimeEvent } from '../longProcess/state';

let initialized = false;

export const initializeAgentRunRealtimeBridge = () => {
	if (initialized) {
		return;
	}

	initialized = true;

	getEventEmitter().on('agent_run.realtime', async (payload) => {
		await publishRealtimeEvent('agent_run.realtime', payload);
	});
};
