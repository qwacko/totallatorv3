import { Output, ToolLoopAgent, stepCountIs, type LanguageModel, type ToolSet } from 'ai';

import { journalSuggestionResultSchema } from './journalSuggestionSchema';

const JOURNAL_SUGGESTION_INSTRUCTIONS = `You generate conservative journal update suggestions.

Rules:
- Start with build_initial_context unless equivalent evidence is already available.
- Use the provided tools to gather targeted follow-up evidence before suggesting changes.
- Prefer import-driven evidence first, then description / amount / frequency evidence.
- Return "no_change" if the journal already looks correctly classified.
- Return "insufficient_context" if evidence is weak or conflicting.
- Only suggest IDs that were observed in tool results.
- Keep reasoning concise and factual.
- Never invent accounts, categories, bills, budgets, tags, or labels.
- Set setDataChecked to true only when the evidence is strong enough for a user-facing suggestion.`;

export const createJournalSuggestionToolLoopAgent = <TOOLS extends ToolSet>({
	model,
	tools,
	maxSteps
}: {
	model: LanguageModel;
	tools: TOOLS;
	maxSteps: number;
}): ToolLoopAgent<never, TOOLS, any> =>
	new ToolLoopAgent({
		model,
		tools,
		instructions: JOURNAL_SUGGESTION_INSTRUCTIONS,
		output: Output.object({
			schema: journalSuggestionResultSchema
		}),
		stopWhen: stepCountIs(maxSteps)
	});
