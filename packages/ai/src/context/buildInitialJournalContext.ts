import type { DBType } from '@totallator/database';

import {
	buildInitialContextOutputSchema,
	buildInitialContextData,
	type BuildInitialContextResult
} from '../tools/context/buildInitialContext';

/**
 * Shared context builder used outside the tool loop.
 *
 * This calls the same underlying data functions as the tools so the preload
 * shape and the interactive tool shape stay aligned. That keeps the agent's
 * initial evidence bundle consistent with what it can request later.
 */
export const buildInitialJournalContext = async ({
	db,
	journalIds,
	evidenceLimitPerJournal = 6
}: {
	db: DBType;
	journalIds: string[];
	evidenceLimitPerJournal?: number;
}): Promise<BuildInitialContextResult> => {
	const result = await buildInitialContextData({
		db,
		journalIds,
		evidenceLimitPerJournal
	});

	return buildInitialContextOutputSchema.parse(result);
};
