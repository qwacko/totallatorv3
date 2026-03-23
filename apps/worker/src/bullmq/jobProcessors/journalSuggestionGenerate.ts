import { workerRegistry } from '@totallator/bullmq';
import type { TypedJobProcessor } from '@totallator/bullmq';
import { runJournalRecommendationAgent } from '@totallator/ai';

import { standaloneContext } from '../../context/workerContext';
import type { WorkerJobMap } from '../jobContracts';

export const journalSuggestionGenerateProcessor: TypedJobProcessor<
	WorkerJobMap,
	'journal-suggestion-generate'
> = async (job) => {
	const payload = job.data.data;

	const result = await standaloneContext(
		{
			requestId: `worker-journal-suggestion-${Date.now()}`,
			routeId: 'worker/ai/journal-suggestion',
			url: '/worker/ai/journal-suggestion',
			method: 'WORKER',
			startTime: Date.now(),
			ip: '127.0.0.1'
		},
		async () =>
			await runJournalRecommendationAgent({
				journalIds: payload.journalIds,
				llmSettingsId: payload.llmSettingsId,
				triggerSource: payload.triggerSource,
				initiatedByUserId: payload.triggeredByUserId
			})
	);

	return {
		success: true,
		data: result
	};
};

workerRegistry.registerTyped<WorkerJobMap, 'journal-suggestion-generate'>(
	'journal-suggestion-generate',
	journalSuggestionGenerateProcessor,
	{
		attempts: 2
	}
);
