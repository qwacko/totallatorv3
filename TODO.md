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

## Phase 4: Feature 1 - Journal Entry Recommendation Service

This phase implements the first core AI feature using the established tool-calling architecture.

-   [ ] **Extend Filter Functionality:**
    -   [ ] Add `llm_review_required` boolean to the `filters` table schema.
    -   [ ] Update the filter UI components to include this option.
    -   [ ] Modify journal queries to support filtering by LLM review status.

-   [ ] **Backend Recommendation Service:**
    -   [ ] Create a journal recommendation service (`src/lib/server/llm/services/journalRecommendationService.ts`).
    -   [ ] This service will orchestrate multi-step LLM conversations using the tool dispatcher.
    -   [ ] Implement logic to identify journal entries needing review based on filter criteria.
    -   [ ] The LLM can call tools like `findSimilarJournalEntries` or `getInvoiceText` before making recommendations.

-   [ ] **Database for Suggestions:**
    -   [ ] Create `journal_llm_suggestions` table schema (id, journal_id, suggested_payee, suggested_description, suggested_category_id, suggested_tag_id, confidence_score, status, llm_log_id, created_at).
    -   [ ] Implement CRUD operations for managing suggestions.

-   [ ] **Frontend for Suggestions:**
    -   [ ] Add suggestion UI to journal details/edit pages.
    -   [ ] Display "Suggestion Available" component showing original vs. suggested values.
    -   [ ] Include "Accept", "Reject", and "Request New Suggestion" buttons.
    -   [ ] Show confidence scores and link to LLM logs for transparency.

-   [ ] **Testing:**
    -   [ ] Write integration tests for the recommendation service with mocked LLM responses.
    -   [ ] Write E2E tests for the suggestion workflow.

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