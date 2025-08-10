import * as z from 'zod';

// ============================================================================
// Journal Categorization Schemas (for single journal processing)
// ============================================================================

export const journalCategorizationSchema = z.object({
	analysis: z.object({
		confidence: z.number().min(0).max(1).describe('Confidence score from 0.0 to 1.0'),
		reasoning: z.string().describe('Explanation of the categorization decision'),
		matchType: z
			.enum(['exact_historical', 'fuzzy_import', 'pattern_based', 'educated_guess'])
			.describe('Type of match found'),
		confidenceFactors: z.array(z.string()).describe('Factors supporting the confidence score')
	}),
	suggestions: z.object({
		payee: z.string().optional().describe('Suggested payee name'),
		description: z.string().optional().describe('Suggested description update'),
		category: z.string().optional().describe('Suggested category ID or name'),
		tag: z.string().optional().describe('Suggested tag ID or name'),
		bill: z.string().optional().describe('Suggested bill ID or name'),
		budget: z.string().optional().describe('Suggested budget ID or name'),
		labels: z.array(z.string()).optional().describe('Suggested label IDs or names')
	}),
	historicalMatches: z
		.array(
			z.object({
				journalId: z.string().describe('ID of the historical journal that matches'),
				reason: z.string().describe('Why this journal is a good match'),
				similarity: z.number().min(0).max(1).describe('Similarity score')
			})
		)
		.optional()
		.describe('Historical journals that influenced this categorization')
});

export type JournalCategorizationResponse = z.infer<typeof journalCategorizationSchema>;

// ============================================================================
// Batch Processing Schemas (for multiple journal processing)
// ============================================================================

export const journalSuggestionSchema = z.object({
	journalId: z.string().describe('ID of the journal being categorized'),
	confidence: z.number().min(0).max(1).describe('Confidence score from 0.0 to 1.0'),
	reasoning: z.string().describe('Explanation of why these suggestions were made'),
	matchType: z
		.enum(['exact_historical', 'fuzzy_import', 'pattern_based', 'educated_guess'])
		.describe('Type of match found'),
	confidenceFactors: z.array(z.string()).describe('Factors supporting the confidence score'),
	suggestions: z.object({
		payee: z.string().optional().describe('Suggested payee name'),
		description: z.string().optional().describe('Suggested description update'),
		category: z.string().optional().describe('Suggested category ID or name'),
		tag: z.string().optional().describe('Suggested tag ID or name'),
		bill: z.string().optional().describe('Suggested bill ID or name'),
		budget: z.string().optional().describe('Suggested budget ID or name'),
		labels: z.array(z.string()).optional().describe('Suggested label IDs or names')
	}),
	historicalMatchIds: z
		.array(z.string())
		.optional()
		.describe('IDs of historical journals used for this suggestion')
});

export const batchInsightsSchema = z.object({
	patternsFound: z.array(z.string()).describe('Patterns discovered across the transactions'),
	historicalMatches: z
		.array(
			z.object({
				sourceJournalId: z.string().describe('ID of the uncategorized journal'),
				matchedJournalId: z.string().describe('ID of the historical journal that matches'),
				reason: z.string().describe('Why these transactions match')
			})
		)
		.describe('Historical matches found'),
	suggestedWorkflows: z.array(z.string()).describe('Workflow suggestions for better categorization')
});

export const processingMetadataSchema = z.object({
	totalJournalsProcessed: z.number().describe('Total number of journals processed'),
	highConfidenceSuggestions: z.number().describe('Count of suggestions with confidence >= 0.8'),
	mediumConfidenceSuggestions: z.number().describe('Count of suggestions with confidence 0.5-0.79'),
	lowConfidenceSuggestions: z.number().describe('Count of suggestions with confidence < 0.5'),
	averageConfidence: z.number().min(0).max(1).describe('Average confidence across all suggestions')
});

export const itemsToCreateSchema = z.object({
	categories: z.array(z.string()).optional().describe('New category names to create'),
	tags: z.array(z.string()).optional().describe('New tag names to create'),
	bills: z.array(z.string()).optional().describe('New bill names to create'),
	budgets: z.array(z.string()).optional().describe('New budget names to create'),
	labels: z.array(z.string()).optional().describe('New label names to create')
});

export const batchProcessingResponseSchema = z.object({
	batchInsights: batchInsightsSchema,
	journalSuggestions: z.array(journalSuggestionSchema).describe('Individual journal suggestions'),
	processingMetadata: processingMetadataSchema,
	itemsToCreate: itemsToCreateSchema
		.optional()
		.describe('New items to create if auto-creation is enabled')
});

export type BatchProcessingResponse = z.infer<typeof batchProcessingResponseSchema>;
export type JournalSuggestion = z.infer<typeof journalSuggestionSchema>;
export type BatchInsights = z.infer<typeof batchInsightsSchema>;
export type ProcessingMetadata = z.infer<typeof processingMetadataSchema>;
export type ItemsToCreate = z.infer<typeof itemsToCreateSchema>;
