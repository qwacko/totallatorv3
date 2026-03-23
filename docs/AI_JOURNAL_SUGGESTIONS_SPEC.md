# AI Journal Suggestions Specification

## Goal

Implement a backend AI suggestion system that proposes journal updates for journals that need review, using a constrained backend agent loop with tools, without allowing the model to directly mutate data.

The first version should:

- generate suggestions for one or more journals
- use an agentic loop so the model can request more context when needed
- use a bounded toolset for data retrieval
- store suggestions for later review
- let the user accept or reject suggestions explicitly
- support manual triggering from a journal view
- support bulk triggering from an existing reusable filter or journal filter
- have test coverage for tools, loop behavior, and responses without live LLM calls

This should be built as a constrained suggestion agent, not a fully autonomous agent.

## Current Implementation Status

The repository now has the first architectural pass implemented.

Implemented:

- dedicated [`packages/ai`](/home/james/totallatorv3/packages/ai) package
- native Vercel AI SDK tool-loop execution for journal recommendations
- task-based provider/model resolution using DB-configured providers
- first-class `agent_run` persistence through business logic
- event emission for realtime frontend consumption
- a substantial initial journal context builder
- a new journal recommendation tool catalog, currently stubbed

Still pending:

- replacing tool stub internals with business-logic-backed retrieval
- scheduler/manual trigger integration
- run-details UI
- acceptance/rejection UI flow refinements

This means the current codebase is at the “architecture and contracts are in place” stage, not the “fully functional recommendation retrieval” stage.

## Current Repository Fit

The repository already has useful building blocks:

- LLM provider settings and encrypted API key storage in [packages/business-logic/src/actions/llmActions.ts](/home/james/totallatorv3/packages/business-logic/src/actions/llmActions.ts)
- Journal suggestion persistence in [packages/business-logic/src/actions/journalLlmSuggestionActions.ts](/home/james/totallatorv3/packages/business-logic/src/actions/journalLlmSuggestionActions.ts)
- Suggestion schema in [packages/database/src/schema/journalLlmSuggestion.ts](/home/james/totallatorv3/packages/database/src/schema/journalLlmSuggestion.ts)
- BullMQ job infrastructure in [packages/bullmq/src/totallatorJobContracts.ts](/home/james/totallatorv3/packages/bullmq/src/totallatorJobContracts.ts)
- Bulk journal update entrypoint in [apps/webapp/src/routes/(loggedIn)/journals/+page.server.ts](/home/james/totallatorv3/apps/webapp/src/routes/(loggedIn)/journals/+page.server.ts)
- Existing journal suggestions UI affordance in [apps/webapp/src/routes/(loggedIn)/journals/JournalActionMenu.svelte](/home/james/totallatorv3/apps/webapp/src/routes/(loggedIn)/journals/JournalActionMenu.svelte)

The main missing pieces are now:

- business-logic support for the richer retrieval tools
- replacing stub data/tool internals with real retrieval logic
- scheduling and UI surfaces around the agent execution pipeline

Implementation note:

- use the Vercel AI SDK for model calls, tool definitions, and loop handling rather than inventing a custom agent abstraction unless the SDK cannot satisfy a concrete need
- use a dedicated `packages/ai` package for agent orchestration, tools, task configuration, and future AI workflows
- keep persisted `agent_run` actions in `packages/business-logic`

## Product Boundaries

### In Scope For V1

- AI suggests updates for existing journals
- Suggestions are persisted and versioned
- Suggestions are always review-first
- Suggestions are generated through a bounded agent loop
- Tools are read-only in V1
- Output is constrained to a schema
- One active suggestion per journal at a time
- Manual and bulk trigger paths
- Run-level visibility for recommendation executions
- Deterministic tests using prepared responses and prepared tool transcripts

### Out Of Scope For V1

- freeform autonomous multi-step agents
- tool-calling that edits journals directly
- long-running memory across sessions
- conversational UI
- self-healing retries based on model introspection
- fully automatic acceptance and application of suggestions

## Core Design

### 1. Treat This As A Constrained Agent, Not A Chatbot

The first implementation should include a small agentic framework because fixed context alone is unlikely to be enough for good suggestions across varied journal data. The model should be able to inspect additional information through tools when the initial context is insufficient.

The model should operate inside a bounded loop:

1. receive initial task and seed context
2. choose either a tool call or final response
3. receive tool result
4. continue until final response or step limit

The application owns:

- loop control
- tool registration and validation
- initial context selection
- schema validation
- confidence thresholds
- persistence
- apply/reject behavior

The model can gather information and propose. The application executes policy and all writes.

### 2. Suggestion Output Contract

Introduce a strict output schema for one journal suggestion result. This should map cleanly onto your existing update shape from [packages/shared/src/schemas/journalSchema.ts](/home/james/totallatorv3/packages/shared/src/schemas/journalSchema.ts).

Suggested contract:

```ts
type JournalSuggestionResult = {
	journalId: string;
	status: 'suggested' | 'no_change' | 'insufficient_context';
	confidence: number;
	summary: string;
	reasons: string[];
	proposedUpdate: {
		description?: string;
		accountId?: string;
		categoryId?: string;
		billId?: string;
		budgetId?: string;
		tagId?: string;
		addLabels?: string[];
		setDataChecked?: boolean;
	};
	warnings: string[];
};
```

Rules:

- prefer linked item IDs over titles in final output
- only allow fields that can be safely applied through existing journal update flows
- do not include unsupported or ambiguous mutations
- if confidence is low, return `insufficient_context` or `no_change`

### 3. Separate Agent Execution From Application

Use a two-stage workflow:

1. Generate suggestion
2. Review and accept or reject suggestion

Acceptance should convert the structured proposal into the existing journal update command shape and apply it through existing update logic. Rejection only updates suggestion status.

Do not let the agent loop or generation worker call journal mutation code directly.

## Proposed Architecture

### AI Layer Placement

The LLM and agent code should live in a dedicated `packages/ai` package that wraps existing business logic rather than being embedded deeply into `packages/business-logic`.

This package should own:

- agent orchestration
- tool definitions
- task/model configuration
- context builders
- event emission for frontend streaming

The AI layer should call into:

- `packages/business-logic` for domain operations and query helpers
- `packages/database` for schema access where appropriate
- existing worker and webapp integration points for execution and UI

This separation keeps:

- business logic deterministic and reusable
- AI-specific prompting, context shaping, and run handling isolated
- tool implementations aligned with existing application logic instead of reimplementing domain rules
- AI-specific dependencies isolated from domain packages
- a clean path for future workflows such as invoice vision processing and chat agents

### Agent Runtime

Use the Vercel AI SDK as the primary execution layer for:

- model calls
- tool definitions
- structured output generation
- multi-step tool-call loops

Avoid creating a custom general-purpose agent framework on top unless the SDK leaves a specific gap that matters for this workflow.

V1 constraints:

- read-only tools only
- max steps should be low, for example 4 to 8
- final response must conform to a strict schema
- tool failures are returned to the model as structured errors
- SDK usage should be wrapped only lightly, mainly for repository-specific wiring and tests

Implementation note:

- the current implementation uses the SDK-native tool loop path for the journal recommendation agent

### Domain Services

Add an explicit AI service layer, for example:

- `packages/ai/src/agents/journalSuggestionAgent.ts`
- `packages/ai/src/agents/journalSuggestionSchema.ts`
- `packages/ai/src/context/buildInitialJournalContext.ts`
- `packages/ai/src/tasks/taskIds.ts`
- `packages/ai/src/config/taskModelProfiles.ts`
- `packages/ai/src/config/modelResolver.ts`
- `packages/ai/src/tools/context/buildInitialContext.ts`
- `packages/ai/src/tools/context/getJournalsContext.ts`
- `packages/ai/src/tools/context/expandImportSimilarity.ts`
- `packages/ai/src/tools/context/expandJournalSimilarity.ts`
- `packages/ai/src/tools/entity/searchEntities.ts`
- `packages/ai/src/tools/submit/submitJournalSuggestion.ts`
- `packages/business-logic/src/actions/agentRunActions.ts`

Responsibilities:

- `journalSuggestionAgent`: defines the task, allowed tools, and final response schema
- `context`: builds substantial initial seed context
- `schema`: validates model output
- `tools`: define the bounded retrieval surface and should ultimately wrap existing business logic
- `taskModelProfiles`: central mapping of AI task to model requirements and defaults
- `modelResolver`: resolves the provider/model to use for a given task
- `agentRunActions`: run persistence and realtime event emission

### Task And Model Resolution

Different AI workflows will need different model capabilities. Journal suggestion, invoice vision, and a future chat agent should not all implicitly share the same model choice.

Model selection should therefore be configured by task, not hardcoded inside individual agents.

Suggested task IDs:

- `journal-recommendation`
- `invoice-vision`
- `assistant-chat`

Suggested profile shape:

```ts
type AITaskModelProfile = {
	taskId: string;
	requiresVision?: boolean;
	preferredProviders: string[];
	defaultModel: string;
	fallbackModel?: string;
	temperature?: number;
	maxSteps?: number;
	structuredOutput: boolean;
};
```

Resolution strategy:

- `packages/ai` defines stable task IDs and default model profiles
- runtime resolution chooses the enabled provider/model for that task
- DB-backed overrides can be added later without changing agent code

This keeps:

- model strategy centralized
- agent code simple
- per-task specialization possible
- future admin configuration straightforward

### Tooling Model

The agent should start with a narrow toolset tailored to journal suggestion generation.

Suggested V1 tools:

- `getJournalById`
- `getTransactionPeers`
- `findSimilarJournals`
- `findSimilarImports`
- `listCandidateAccounts`
- `listCandidateCategories`
- `listCandidateTags`
- `listCandidateBills`
- `listCandidateBudgets`
- `listCandidateLabels`

Each tool should have:

- a typed input schema
- a typed output schema
- deterministic behavior for tests
- a stable name and version

The agent should not get direct access to arbitrary SQL, generic search, or mutation tools in V1.

For import-aware suggestions, likely useful sources are:

- matching or similar `importUniqueId` values
- related import detail rows
- prior journals created from similar import sources

The import-oriented retrieval can be supplied partly as seed context and partly as on-demand tools. The default preference should be:

- include small, high-signal import hints in seed context
- use tools for broader historical import lookups

### Worker Job

Add a BullMQ job type such as:

- `journal-suggestion-generate`

Job payload:

```ts
type JournalSuggestionGenerateJobData = {
	journalIds: string[];
	triggeredByUserId?: string;
	triggerSource: 'manual-single' | 'manual-bulk' | 'reusable-filter';
	llmSettingsId: string;
	filterId?: string;
	maxJournals?: number;
	agentRunId?: string;
};
```

Worker responsibilities:

- load seed journal context
- skip journals with current pending suggestions unless forced
- run the agent loop
- validate output
- persist one suggestion per journal
- store failures separately from suggestion status

### Trigger Entry Points

V1 should support two trigger modes:

1. Single journal
   Add a button/action from the journal view or existing suggestions modal.

2. Filter-driven batch
   Resolve journal IDs from an existing filter and enqueue a background job.

The batch trigger should be bounded:

- default max journal count should be meaningfully larger than originally proposed because context can be shared across journals, especially within a single account or filter result
- initial target should be more like 100 to 250 journals per run, then tuned based on latency and cost
- explicit chunking for larger selections
- rate limiting per provider
- chunking strategy should preserve grouping where possible, for example by account, import source, or filter cohort, so shared context can be reused

## Seed Context And Tool Context

The initial model input should still include a compact seed context so the agent does not need to fetch everything through tools. The loop should then request additional data only when needed.

Recommended split:

- seed context: always included in step 1
- tool context: fetched on demand via tools

Where possible, build seed context that is shared at the run level instead of duplicating the same account/filter metadata for every journal.

## Seed Journal Context Payload

The initial model input needs to be rich enough to start reasoning, but stable enough for tests.

Suggested per-journal context:

```ts
type JournalSuggestionContext = {
	runContext?: {
		accountId?: string | null;
		accountTitle?: string | null;
		filterId?: string | null;
		filterSummary?: string | null;
	};
	journal: {
		id: string;
		date: string;
		amount: number;
		description: string;
		accountId?: string | null;
		accountTitle?: string | null;
		categoryId?: string | null;
		categoryTitle?: string | null;
		tagId?: string | null;
		tagTitle?: string | null;
		billId?: string | null;
		billTitle?: string | null;
		budgetId?: string | null;
		budgetTitle?: string | null;
		labels: { id: string; title: string }[];
		complete: boolean;
		reconciled: boolean;
		dataChecked: boolean;
		linked: boolean;
		transfer: boolean;
	};
	transactionPeers: {
		id: string;
		accountId?: string | null;
		accountTitle?: string | null;
		amount: number;
		description: string;
	}[];
	relatedHistory: {
		recentSimilarByDescription: Array<{
			journalId: string;
			description: string;
			amount: number;
			categoryId?: string | null;
			categoryTitle?: string | null;
			tagId?: string | null;
			tagTitle?: string | null;
			billId?: string | null;
			billTitle?: string | null;
			budgetId?: string | null;
			budgetTitle?: string | null;
		}>;
		recentSimilarByImport: Array<{
			journalId: string;
			importId?: string | null;
			importDetailId?: string | null;
			importUniqueId?: string | null;
			description: string;
			amount: number;
			categoryId?: string | null;
			categoryTitle?: string | null;
		}>;
	};
	candidates: {
		accounts: Array<{ id: string; title: string }>;
		categories: Array<{ id: string; title: string }>;
		tags: Array<{ id: string; title: string }>;
		bills: Array<{ id: string; title: string }>;
		budgets: Array<{ id: string; title: string }>;
		labels: Array<{ id: string; title: string }>;
	};
};
```

Important constraints:

- pass candidate IDs and titles so the model chooses from bounded values instead of inventing new entities
- do not front-load every possible related record into the seed context
- prefer tools for expensive or high-cardinality lookups
- prefer shared run-level seed context over repeated per-journal context where practical

## Agent Prompting Strategy

Use a structured initial prompt with three sections:

1. System instruction
   The model is a financial journal suggestion agent. It may either call a tool or return a final response. It must only choose from supplied IDs.

2. Policy rules
   Rules such as:
   - do not suggest changes for transfers unless specifically asked
   - do not fabricate IDs
   - prefer `no_change` when uncertain
   - keep summaries short
   - do not mutate data directly
   - do not call tools after enough information is already available

3. Tool specification
   Tool names, argument schemas, and behavior expectations

4. Seed context payload
   Deterministic JSON payload for one or multiple journals

Avoid few-shot examples in the runtime prompt initially. Use them in tests and fixtures instead.

## Persistence Model

The persistence model should distinguish clearly between:

- per-journal suggestions
- per-execution agent runs

The existing `journal_llm_suggestions` table is still useful for storing the actionable result attached to a journal, but the detailed execution record should live in a separate `agent_run` model rather than being embedded into the suggestion row.

Recommended model shape:

### Agent Run

A new `agent_run` entity should capture:

- run ID
- task ID
- status
- trigger source
- llm settings ID
- model
- prompt version
- started at / completed at
- initiated by user
- target journal count
- processed journal count
- accepted suggestion count
- rejected suggestion count
- failure count
- lightweight summary fields for UI

### Agent Run Step Or Event

Optionally persist step-level details in a separate table, for example:

- agent run ID
- tool call name
- tool call args
- tool result summary
- model response summary
- error summary
- timestamps

This should be designed to support a run-details page without stuffing arbitrary execution JSON into the suggestion table.

### Journal Suggestion

Keep the journal suggestion row focused on the business result:

- journal ID
- suggestion status
- suggested fields
- confidence
- human-readable summary / reasoning
- agent run ID
- llm log ID if still useful

This gives you:

- a clean per-journal review model
- a run-level audit trail
- a simpler path to a UI where clicking a suggestion links to the run that produced it

### Logging And OTEL

There is a balance between persisting everything and duplicating observability data already available in OTEL.

Recommendation:

- keep full low-level timing and telemetry in OTEL
- persist only the application-level run record and the subset of step details that users or developers need to inspect inside the product

For V1, persisting a concise run record plus optional summarized step entries is probably enough.

## Event Streaming

Different steps and tool calls should also be emitted over the application event bus so the frontend can subscribe over SSE and render progress live while a run is executing.

This should be treated as a first-class part of the architecture, not an optional extra.

Suggested event types:

- `agent_run.started`
- `agent_run.step_started`
- `agent_run.tool_called`
- `agent_run.tool_completed`
- `agent_run.model_response`
- `agent_run.journal_completed`
- `agent_run.completed`
- `agent_run.failed`

Suggested event payload shape:

```ts
type AgentRunEvent = {
	type: string;
	agentRunId: string;
	taskId: string;
	timestamp: string;
	journalId?: string;
	stepIndex?: number;
	summary?: string;
	data?: Record<string, unknown>;
};
```

Recommended behavior:

- emit live events as the run progresses
- persist the run record independently of event delivery
- keep payloads small enough for frontend streaming
- avoid sending sensitive raw provider payloads directly unless explicitly needed

The frontend can then:

- subscribe to a run-specific SSE stream
- show current step progress
- show tool activity as it happens
- transition from live execution to the persisted run-details page once complete

## Acceptance Flow

When a user accepts a suggestion:

1. load the suggestion
2. validate `suggestionPayload` again
3. transform `proposedUpdate` into the existing update command shape
4. call existing journal update action with `filter: { id: journalId }`
5. mark suggestion as `accepted`
6. optionally set `processedBy` and `processedAt`
7. supersede any older pending suggestions

When a user rejects a suggestion:

- mark suggestion as `rejected`
- do not mutate journal data

## Testing Strategy

This part matters more than provider integration. Testing must be built into the tools and response flow from the start, not added afterward.

### Principle

Test orchestration, tool use, and policy using deterministic fake model outputs and deterministic tool results. Do not make unit tests depend on live providers.

The testing strategy should align with the Vercel AI SDK usage rather than testing a custom abstraction layer that does not exist in production.

### Test Layers

1. Schema tests
   Validate good and bad LLM outputs against the suggestion schema.

2. Tool schema tests
   Validate tool args and tool results against their schemas.

   Include direct tests for Vercel AI SDK tool definitions where practical.

3. Prompt and seed-context tests
   Verify that the initial prompt and seed context include required fields and exclude noisy fields.

4. Agent loop tests with prepared transcripts
   Inject fake provider step responses and assert:
   - tool calls are executed in order
   - tool results are fed back correctly
   - invalid tool calls are rejected
   - max-step behavior works
   - the loop stops on final response

5. Runner tests with prepared responses
   Inject fake provider responses and fake tool results and assert:
   - valid response persists suggestion
   - invalid JSON is rejected
   - invented IDs are rejected
   - low-confidence results become `no_change` or are not persisted as actionable suggestions
   - unsupported tool names fail safely
   - shared run context is handled correctly across multiple journals
   - import-similarity lookups influence the result path when present
   - event bus emissions are produced for run lifecycle and tool activity

6. Action tests
   Verify manual single and batch enqueue behavior.

7. Event streaming tests
   Verify SSE-facing event payloads are emitted in the expected order and are sufficiently small / stable for UI use.

8. Acceptance tests
   Verify accepted suggestions mutate journals through the normal update path.

9. Worker integration tests
   Run the processor with a fake LLM client and real test DB.

### Prepared LLM Responses

Add explicit fixtures rather than snapshots of prompts. Example structure:

- `packages/ai/src/__fixtures__/journal-suggestion/valid-grocery.json`
- `packages/ai/src/__fixtures__/journal-suggestion/invalid-invented-category.json`
- `packages/ai/src/__fixtures__/journal-suggestion/no-change.json`
- `packages/ai/src/__fixtures__/journal-suggestion/invalid-shape.json`
- `packages/ai/src/__fixtures__/journal-suggestion/tool-loop-grocery.json`
- `packages/ai/src/__fixtures__/journal-suggestion/tool-loop-max-steps.json`
- `packages/ai/src/__fixtures__/journal-suggestion/tool-loop-with-events.json`

Each fixture should contain:

- input context ID
- optional tool transcript
- optional emitted event sequence
- raw model step responses
- parsed expected final result
- expectation about persistence behavior

This lets you test the hard parts:

- output handling
- tool invocation behavior
- multi-step control flow

without depending on wording.

### Fake Provider Interface

Define a provider interface like:

```ts
interface JournalSuggestionModel {
	respond(input: {
		messages: AgentMessage[];
		tools: AgentToolDefinition[];
		schemaVersion: string;
	}): Promise<{
		rawText: string;
		model: string;
		provider: string;
	}>;
}
```

In production, this uses the selected LLM provider.
In tests, this returns fixture payloads.

### Fake Tool Executor

Define a tool executor abstraction that can be replaced in tests:

```ts
interface AgentToolExecutor {
	execute(name: string, input: unknown): Promise<{
		ok: boolean;
		result?: unknown;
		error?: {
			code: string;
			message: string;
		};
	}>;
}
```

In production, tools query the real DB and business logic.
In tests, tools return prepared deterministic fixtures.

Where the Vercel AI SDK test surface makes this awkward, prefer thin adapter seams around the SDK calls rather than building a parallel agent framework.

### What To Avoid In Tests

- asserting exact prompt prose unless absolutely necessary
- asserting exact model reasoning text
- asserting huge end-to-end transcripts when a smaller contract assertion will do
- live OpenAI or Anthropic calls in CI
- brittle snapshots of large JSON payloads

## Safety Rules

Before suggestions become user-visible, apply these checks:

- reject outputs that reference IDs not present in candidate lists
- reject outputs that suggest updating transfer journals unless policy allows it
- reject outputs with empty summary and non-empty mutation
- reject outputs that attempt unsupported fields
- require confidence above a configurable threshold for actionable suggestions

Suggested thresholds:

- `>= 0.85`: show as strong suggestion
- `0.60 - 0.84`: show with caution
- `< 0.60`: convert to `insufficient_context` or do not create suggestion

## Observability

For each generation attempt, log:

- agent run ID
- task ID
- journal count
- provider ID
- model
- prompt version
- latency
- token usage if available
- valid vs invalid response
- persisted suggestion count
- skipped count

If you already have an LLM log table planned, each suggestion should link to it through `llmLogId`.

The run itself should also be inspectable from the UI.

Suggested V1 UI behavior:

- each manual or batch recommendation execution creates a visible run
- a run list page shows task, status, trigger source, duration, journal counts, and result counts
- clicking a run shows:
  - target journals
  - per-journal suggestion results
  - tool calls made
  - summarized model responses
  - streamed step timeline
  - links to related OTEL traces where available

## Recommended Implementation Order

### Phase 1: Foundation

- create `packages/ai`
- wire Vercel AI SDK as the primary agent and tool execution layer
- define tool registry and tool schemas
- define structured suggestion schema
- add provider interface and fake provider
- add fake tool executor
- add prompt builder and parser
- add tests using prepared responses and prepared tool transcripts

### Phase 2: Persistence And Actions

- add `agent_run` persistence
- add optional `agent_run_step` or `agent_run_event` persistence
- link journal suggestions to `agent_run`
- create generation orchestration action
- create accept/reject action

### Phase 3: Background Processing

- add BullMQ job contract
- implement worker processor
- emit agent run events over the event bus
- add manual single trigger

### Phase 4: Bulk Triggering

- support trigger from reusable filter or current journal filter
- add batch chunking and rate limiting

### Phase 5: UI Review Improvements

- display summary, confidence, warnings
- show exact proposed field changes before accept
- allow regenerate

## Concrete V1 Deliverables

1. Small reusable backend agent loop
2. `packages/ai` backend layer that wraps business logic
3. Typed read-only tool registry for journal suggestion workflows
4. Import-aware retrieval tools and seed context
5. Structured suggestion schema and parser
6. Fake provider with prepared fixture responses
7. Fake tool executor with prepared tool results
8. `agent_run` persistence and run-details model
9. Business logic action to generate suggestions for one or more journal IDs
10. BullMQ background job for batch generation
11. Event bus emission for run and tool activity with SSE-ready payloads
12. Accept/reject actions
13. Minimal UI trigger for single journal plus a run-details view
14. Unit and integration tests covering tool execution, loop behavior, success, invalid output, low confidence, import-aware retrieval, event emission, and acceptance flow

## Recommendation

The right first implementation is a constrained background suggestion agent with:

- one job type
- Vercel AI SDK as the tool and loop runtime
- one small step-based loop
- one bounded read-only toolset
- a separate backend AI package that wraps business logic
- one structured output schema
- one review/apply workflow
- `agent_run` as a first-class persisted record
- live event emission for run progress and tool activity
- no autonomous writes
- strong fake-provider and fake-tool tests

If this works, you can later evolve it into a broader agent system using the same patterns:

- bounded tools
- strict contracts
- replayable fixtures
- queue-based orchestration
