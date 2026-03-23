import { tool } from 'ai';
import { z } from 'zod';

import { journalSuggestionResultSchema } from '../../agents/journalSuggestionSchema';

export const submitJournalSuggestionInputSchema = z.object({
	suggestion: journalSuggestionResultSchema,
	evidenceNotes: z.array(z.string()).default([])
});

/**
 * Terminating tool for future explicit agent completion.
 *
 * There is intentionally no execute function. When the model calls this tool,
 * the AI SDK loop will stop and the caller can inspect the static tool call.
 *
 * The current journal agent path still relies on structured output parsing.
 * This tool is being introduced now so the tool catalog is ready for a later
 * move to an explicit tool-driven completion pattern.
 */
export const buildSubmitJournalSuggestionTool = () =>
	tool({
		description:
			'Submit the final structured journal suggestion once enough evidence has been gathered.',
		inputSchema: submitJournalSuggestionInputSchema
	});
