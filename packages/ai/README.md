# `@totallator/ai`

AI orchestration package for Totallator.

This package is the boundary for:

- agent orchestration
- AI SDK tool definitions
- context building
- task-to-model resolution
- future AI-specific workflows such as invoice vision and chat

This package is intentionally not the source of truth for domain rules or persistence.

## Boundary

`packages/ai` should own:

- prompts and agent instructions
- tool wiring and tool schemas
- initial context building
- model/provider selection for AI tasks
- execution flow for agent workflows

`packages/business-logic` should own:

- domain queries and mutations
- persistence actions for business/domain records
- reusable retrieval helpers that are not AI-specific
- LLM settings storage and API key handling
- `agent_run` persistence actions

The intended pattern is:

1. `packages/ai` orchestrates a workflow
2. tools/context builders call into business logic
3. final accepted updates go through normal business logic mutation paths

## Current Status

Implemented:

- `packages/ai` package and exports
- journal recommendation agent orchestration
- native Vercel AI SDK `ToolLoopAgent` usage
- task-based provider/model resolution
- substantial initial context preload
- first-class `agent_run` persistence through business logic
- realtime step/run event emission
- stubbed journal recommendation tool catalog
- deterministic tests for the current execution path

Not implemented yet:

- real business-logic-backed tool retrieval for the new stubbed tools
- scheduler-triggered recommendation runs
- manual trigger UX
- agent run list/details UI
- invoice vision or chat workflows

## Main Files

- [src/agents/journalSuggestionAgent.ts](/home/james/totallatorv3/packages/ai/src/agents/journalSuggestionAgent.ts)
  Main journal recommendation orchestration entrypoint.
- [src/context/buildInitialJournalContext.ts](/home/james/totallatorv3/packages/ai/src/context/buildInitialJournalContext.ts)
  Builds the preload context that is given to the agent before tool calls.
- [src/tools/context/buildInitialContext.ts](/home/james/totallatorv3/packages/ai/src/tools/context/buildInitialContext.ts)
- [src/tools/context/getJournalsContext.ts](/home/james/totallatorv3/packages/ai/src/tools/context/getJournalsContext.ts)
- [src/tools/context/expandImportSimilarity.ts](/home/james/totallatorv3/packages/ai/src/tools/context/expandImportSimilarity.ts)
- [src/tools/context/expandJournalSimilarity.ts](/home/james/totallatorv3/packages/ai/src/tools/context/expandJournalSimilarity.ts)
- [src/tools/entity/searchEntities.ts](/home/james/totallatorv3/packages/ai/src/tools/entity/searchEntities.ts)
- [src/tools/submit/submitJournalSuggestion.ts](/home/james/totallatorv3/packages/ai/src/tools/submit/submitJournalSuggestion.ts)
  Current tool surface. These define the target contracts for the next implementation pass.
- [src/config/modelResolver.ts](/home/james/totallatorv3/packages/ai/src/config/modelResolver.ts)
- [src/config/createLanguageModel.ts](/home/james/totallatorv3/packages/ai/src/config/createLanguageModel.ts)
  Task/model resolution and provider dispatch.

## Provider Resolution

Provider selection is taken from the existing LLM settings row in the database.

Important note:

- the DB field is still named `apiUrl`
- in practice it currently stores the provider ID selected in the UI
- expected values are: `openai`, `anthropic`, `google`, `xai`, `groq`, `openrouter`

The AI package resolves:

- provider ID from the stored setting
- model from `defaultModel` or the task profile default
- API key from business logic

Provider creation should use official/community AI SDK provider packages, not custom base URL handling.

## Journal Recommendation Flow

Current execution shape:

1. Create `agent_run`
2. Resolve model/provider for `journal-recommendation`
3. Build substantial initial context for the target journal
4. Run the native AI SDK tool loop
5. Persist per-step run events
6. Persist per-journal suggestion result
7. Mark run complete

The agent is constrained:

- tools are read-only
- final output is schema-bound
- the agent does not directly mutate journals

## Next Step

The next development step is not more agent infrastructure.

The next step is:

1. finalize the target tool contracts
2. implement the missing retrieval/query support in `packages/business-logic`
3. replace the stubbed tool internals with business-logic-backed implementations
4. then add scheduler/manual-trigger/UI surfaces
