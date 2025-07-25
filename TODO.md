# LLM Integration TODO List (v3)

This document outlines the steps to integrate LLM-based features into the bookkeeping application. This revised plan prioritizes a test-driven development (TDD) approach and implements a more robust, extensible architecture where the LLM can call internal application tools.

## Phase 1: Core Infrastructure & Testing Foundation ✅ COMPLETED

This phase focuses on building the essential backend components and establishing a testing framework from the outset to minimize costs and ensure reliability.

-   [x] **Mock LLM Client & Initial Test Suite:**
    -   [x] Create a mock version of the `LLMClient` for use in automated tests (Vitest, Playwright). This client will return predefined, realistic JSON responses without making real network requests.
    -   [x] Set up the initial testing environment for backend services.

-   [x] **Database Schema Updates:**
    -   [x] Create `llm_settings` table (id, title, api_url, encrypted api_key, default_model, enabled, timestamps).
    -   [x] Create `llm_logs` table (id, timestamp, llm_settings_id, request_payload, response_payload, duration_ms, status, related_journal_id).

-   [x] **Backend Configuration Service (TDD Approach):**
    -   [x] Write unit tests for CRUD operations on `llm_settings`.
    -   [x] Implement CRUD operations with encryption/decryption of the `api_key` (`src/lib/server/db/actions/llmActions.ts`).
    -   [ ] **IN PROGRESS:** Implement API endpoints to expose CRUD operations via SvelteKit routes.

-   [x] **Generic LLM API Client (TDD Approach):**
    -   [x] Write unit tests for the `LLMClient` that verify correct request formation and logging.
    -   [x] Implement the client to make the tests pass. Provider-agnostic client supporting OpenAI and Anthropic with automatic logging (`src/lib/server/llm/client.ts`).

## Phase 2: LLM Tool-Calling Framework ✅ COMPLETED

This phase builds the system that allows the LLM to interact with the application's data and functions in a structured way.

-   [x] **Tool Definition & Dispatcher:**
    -   [x] Design a framework for defining tools the LLM can use (`src/lib/server/llm/tools/types.ts`).
    -   [x] Create a central "tool dispatcher" service (`src/lib/server/llm/tools/dispatcher.ts`). This service parses tool-call requests from the LLM, executes the corresponding application function, and returns the result in a format the LLM can understand.

-   [x] **Implement Initial Tools (with Unit Tests):**
    -   [x] **`findSimilarJournalEntries`**: Leverages existing `journalMaterializedViewActions.listRecommendations()` for sophisticated import data similarity matching. Supports both journal_id-based similarity and general search criteria.
    -   [x] **`getInvoiceText`**: A tool that takes a `file_id` or `journal_id` and returns the OCR text content of a linked invoice/receipt.
    -   [x] **`updateJournalEntry`**: A tool that allows the LLM to propose specific, structured updates to a journal entry with validation and change tracking.

-   [x] **Testing:**
    -   [x] Write unit tests for each tool to ensure it functions correctly.
    -   [x] Write integration tests for the tool dispatcher to verify it can correctly route and execute tool calls (`src/lib/server/llm/tools/dispatcher.test.ts`).

## Phase 3: Frontend Configuration & API Integration ✅ COMPLETED

This phase involved building the UI for managing LLM providers and implementing the page-based architecture.

-   [x] **LLM Provider Management Pages:**
    -   [x] Renamed from "LLM Settings" to "LLM Providers" for better clarity.
    -   [x] Restructured to follow established SvelteKit page patterns (separate create/update/delete pages).
    -   [x] Implemented proper routes and authGuard configuration.
    -   [x] Used page-based architecture (`+page.server.ts` and `+page.svelte`) instead of API endpoints.

-   [x] **LLM Provider Pages:**
    -   [x] Main listing page at `/settings/providers` with enable/disable functionality.
    -   [x] Create page at `/settings/providers/create` with simplified text inputs (no dropdowns).
    -   [x] Update page at `/settings/providers/[id]` with form validation and error handling.
    -   [x] Delete page at `/settings/providers/[id]/delete` with confirmation.
    -   [x] Full CRUD operations using existing `tActions.llm` with proper encryption.

-   [x] **LLM Log Viewer:**
    -   [x] Log viewer page at `/settings/providers/logs` with comprehensive filtering.
    -   [x] Pagination, status filtering, date range filtering, and provider filtering.
    -   [x] Modal for viewing full request/response payloads.
    -   [x] Proper column store integration for customizable table display.

-   [x] **Integration & Polish:**
    -   [x] Added proper column stores (`llmProviderColumnsStore`, `llmLogColumnsStore`).
    -   [x] Follows established patterns from bills/categories pages.
    -   [x] Supports any provider (OpenAI, Anthropic, custom) via flexible text inputs.

## Phase 4: Feature 1 - Journal Entry Recommendation Service ✅ COMPLETED

This phase implements the first core AI feature using an enum-based status system with comprehensive UI integration and automatic status management.

-   [x] **Database Schema Updates:**
    -   [x] Create `journal_llm_suggestions` table with comprehensive suggestion tracking.
    -   [x] Implement CRUD operations for managing LLM suggestions (`journalLlmSuggestionActions.ts`).
    -   [x] Add `llmReviewStatus` enum to `journalEntry` table (`not_required`, `required`, `complete`, `error`).
    -   [x] Create database migration with proper defaults for existing records.
    -   [x] Add proper indexing for efficient status-based queries.
    -   [x] Update materialized views (`journal_view`, `journal_extended_view`) to include `llmReviewStatus`.

-   [x] **Enhanced Recommendation System:**
    -   [x] Create journal recommendation service that integrates with existing recommendation modal.
    -   [x] Implement `journal_categorization` LLM tool for analyzing transactions.
    -   [x] Extend existing recommendation display to show both similarity and LLM suggestions.
    -   [x] Add visual indicators (AI vs Similarity badges) and reasoning display.
    -   [x] Seamless integration with existing `RecommendationButton`/`RecommendationDisplay` components.

-   [x] **Environment Variable Configuration:**
    -   [x] Add env vars to control when journals get marked as `required`:
        - `LLM_REVIEW_ENABLED=false` (global enable/disable, default: disabled for security)
        - `LLM_REVIEW_AUTO_IMPORT=true` (mark imported journals as required)
        - `LLM_REVIEW_MANUAL_CREATE=false` (don't mark manual journals as required)
        - `LLM_REVIEW_SCHEDULE=*/15 * * * *` (cron schedule for processing)
    -   [x] Update journal creation/import logic to set status based on env vars.
    -   [x] Automatic status assignment in `generateItemsForJournalCreation.ts`.

-   [x] **Complete UI Integration:**
    -   [x] Add `llmReviewStatus` column to journal table with color-coded badges.
    -   [x] Column header dropdown filtering for LLM status.
    -   [x] Filter modal integration with status selection dropdown.
    -   [x] Text search keywords: `llm:not_required`, `llm:required`, `llm:complete`, `llm:error`.
    -   [x] Filter-to-text conversion for displaying applied filters.
    -   [x] Autocomplete support for text filter keywords.
    -   [x] Create `LlmReviewStatusBadge` component with clickable filtering.

-   [x] **Backend Integration:**
    -   [x] Extend `journalFilterSchema` to support `llmReviewStatus` enum filtering.
    -   [x] Update `materializedJournalFilterToQuery` for database query support.
    -   [x] Integrate with text filter processing system.
    -   [x] Add to journal ordering and sorting capabilities.

-   [ ] **Future Enhancements (Next Phase):**
    -   [ ] ReusableFilter integration for automatic status assignment.
    -   [ ] Background cron job for processing `required` journals.
    -   [ ] Bulk status management operations.
    -   [ ] Advanced LLM suggestion acceptance/rejection workflow.

## Phase 5: Feature 2 - Invoice/Image Recognition (Vision Models)

This phase extends the LLM functionality to handle image-based recognition using vision models.

-   [ ] **Update LLM Client & Tools for Vision:**
    -   [ ] Modify the `LLMClient` to handle multimodal (vision) requests with image data.
    -   [ ] Create a new tool: `analyzeInvoiceImage(file_id: string)` that uses vision models to extract vendor, amount, date, line items, etc.
    -   [ ] Add support for vision model providers (OpenAI GPT-4V, Anthropic Claude 3).

-   [ ] **Frontend Integration:**
    -   [ ] Add "Scan with AI" button to the file/image attachment UI in journal entries.
    -   [ ] Create modal/component to display extracted data and allow user to apply it to the journal.
    -   [ ] Handle different image formats and file size limitations.

-   [ ] **Testing:**
    -   [ ] Update the mock `LLMClient` to handle vision model requests and responses.
    -   [ ] Write E2E tests for the "Scan with AI" feature using test images.

## Additional Enhancements (Future Phases)

-   [ ] **Advanced Tool Integration:**
    -   [ ] Create tools for account/category/tag suggestion based on transaction patterns.
    -   [ ] Implement bulk processing workflows for multiple journal entries.
    -   [ ] Add tools for budget analysis and financial insights.

-   [ ] **Performance & Monitoring:**
    -   [ ] Add metrics and monitoring for LLM usage and costs.
    -   [ ] Implement rate limiting and usage quotas.
    -   [ ] Add background job processing for batch LLM operations.

-   [ ] **Security & Compliance:**
    -   [ ] Add audit logging for all LLM-driven changes.
    -   [ ] Implement user permissions for LLM features.
    -   [ ] Add data retention policies for LLM logs and suggestions.