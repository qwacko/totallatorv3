import type { SummaryCacheSchemaDataType } from '@totallator/shared';

export type JournalSummaryPropType =
	| Promise<SummaryCacheSchemaDataType[]>
	| Promise<SummaryCacheSchemaDataType>;
