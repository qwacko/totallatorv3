import type { SummaryCacheSchemaDataType } from '$lib/schema/summaryCacheSchema';

export type JournalSummaryPropType =
	| Promise<SummaryCacheSchemaDataType[]>
	| Promise<SummaryCacheSchemaDataType>;
