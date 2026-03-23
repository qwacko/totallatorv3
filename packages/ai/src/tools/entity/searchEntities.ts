import { tool } from 'ai';
import { z } from 'zod';

import type { DBType } from '@totallator/database';

import { entitySearchCandidateSchema, entitySearchTypeSchema } from '../types';

const inputSchema = z.object({
	entityTypes: z.array(entitySearchTypeSchema).min(1),
	searchTerms: z.array(z.string().min(1)).min(1),
	accountId: z.string().optional(),
	limit: z.number().int().positive().max(25).default(8)
});

export const searchEntitiesInputSchema = inputSchema;

export const searchEntitiesOutputSchema = z.object({
	candidates: z.array(entitySearchCandidateSchema),
	notes: z.array(z.string()).default([])
});

export type SearchEntitiesResult = z.infer<typeof searchEntitiesOutputSchema>;

/**
 * Stub implementation for grounded entity resolution.
 *
 * Intended future behavior:
 * - Query business-logic-backed candidate lists for supported entity types.
 * - Apply fuzzy matching / similarity scoring over titles and aliases.
 * - Optionally use account context to bias candidates.
 */
export const searchEntitiesData = async ({
	db: _db,
	entityTypes,
	searchTerms,
	accountId,
	limit
}: {
	db: DBType;
	entityTypes: Array<z.infer<typeof entitySearchTypeSchema>>;
	searchTerms: string[];
	accountId?: string;
	limit: number;
}): Promise<SearchEntitiesResult> => {
	return {
		candidates: [],
		notes: [
			`Stub entity search requested for entity types: ${entityTypes.join(', ')}.`,
			`Search terms: ${searchTerms.join(', ')}.`,
			accountId
				? `Account context ${accountId} should bias future candidate resolution.`
				: 'No account context provided for entity search.',
			`Future implementation should return up to ${limit} ranked candidates per call.`
		]
	};
};

export const buildSearchEntitiesTool = (db: DBType) =>
	tool({
		description:
			'Resolve accounts, categories, tags, labels, bills, and budgets from fuzzy search terms.',
		inputSchema,
		outputSchema: searchEntitiesOutputSchema,
		execute: async ({ entityTypes, searchTerms, accountId, limit }) =>
			await searchEntitiesData({
				db,
				entityTypes,
				searchTerms,
				accountId,
				limit
			})
	});
