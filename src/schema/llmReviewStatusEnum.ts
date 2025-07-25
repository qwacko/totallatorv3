export const llmReviewStatusEnum = [
	'not_required',
	'required', 
	'complete',
	'error'
] as const;

export type LlmReviewStatusEnumType = (typeof llmReviewStatusEnum)[number];

export const llmReviewStatusEnumTitles: Record<LlmReviewStatusEnumType, string> = {
	not_required: 'No Review Needed',
	required: 'Needs LLM Review', 
	complete: 'LLM Review Complete',
	error: 'LLM Processing Error'
};

export const llmReviewStatusEnumSelection = [
	{ value: 'not_required', name: 'Not Required' },
	{ value: 'required', name: 'Needs Review' },
	{ value: 'complete', name: 'Complete' },
	{ value: 'error', name: 'Error' }
] satisfies { value: LlmReviewStatusEnumType; name: string }[];