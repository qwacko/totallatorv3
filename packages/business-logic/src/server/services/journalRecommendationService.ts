import type { RecommendationType } from '@/actions/journalMaterializedViewActions';

export type JournalRecommendationServiceInput = {
	id: string;
	description: string;
	dataChecked: boolean;
	accountId: string;
	amount: number;
	date: Date;
	importDetail?: { dataToUse?: any } | null;
};

export type EnhancedRecommendationType = RecommendationType & {
	source: 'similarity' | 'llm';
	llmConfidence?: number;
	llmReasoning?: string;
	llmSuggestionId?: string;
};
