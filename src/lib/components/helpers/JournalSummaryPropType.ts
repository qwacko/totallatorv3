import type { JournalSummaryType } from '$lib/server/db/actions/journalActions';

export type JournalSummaryPropType =
	| Promise<(JournalSummaryType & { id: string })[]>
	| Promise<JournalSummaryType>;
