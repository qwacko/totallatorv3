# LLM Integration TODO List (v2)

This document outlines the steps to integrate LLM-based features into the bookkeeping application. This revised plan prioritizes a test-driven development (TDD) approach and implements a more robust, extensible architecture where the LLM can call internal application tools.

## Phase 1: Core Infrastructure & Testing Foundation

This phase focuses on building the essential backend components and establishing a testing framework from the outset to minimize costs and ensure reliability.

-   [ ] **Mock LLM Client & Initial Test Suite:**
    -   [ ] Create a mock version of the `LLMClient` for use in automated tests (Vitest, Playwright). This client will return predefined, realistic JSON responses without making real network requests.
    -   [ ] Set up the initial testing environment for backend services.

-   [ ] **Database Schema Updates:**
    -   [ ] Create `llm_settings` table (id, title, api_url, encrypted api_key, default_model, enabled, timestamps).
    -   [ ] Create `llm_logs` table (id, timestamp, llm_settings_id, request_payload, response_payload, duration_ms, status, related_journal_id).

-   [ ] **Backend Configuration Service (TDD Approach):**
    -   [ ] Write unit tests for CRUD operations on `llm_settings`.
    -   [ ] Implement the API endpoints to make the tests pass. Logic must handle encryption/decryption of the `api_key`.

-   [ ] **Generic LLM API Client (TDD Approach):**
    -   [ ] Write unit tests for the `LLMClient` that verify correct request formation and logging.
    -   [ ] Implement the client to make the tests pass. It should be provider-agnostic and use the `llm_logs` table automatically.

## Phase 2: LLM Tool-Calling Framework

This phase builds the system that allows the LLM to interact with the application's data and functions in a structured way.

-   [ ] **Tool Definition & Dispatcher:**
    -   [ ] Design a framework for defining tools the LLM can use (e.g., a directory of tool definition files).
    -   [ ] Create a central "tool dispatcher" service. This service will parse tool-call requests from the LLM, execute the corresponding application function, and return the result in a format the LLM can understand.

-   [ ] **Implement Initial Tools (with Unit Tests):**
    -   [ ] **`findSimilarJournalEntries`**: A tool that takes a description, amount, or payee and returns a list of existing journal entries that are potential matches.
    -   [ ] **`getInvoiceText`**: A tool that takes a `file_id` or `journal_id` and returns the OCR text content of a linked invoice/receipt.
    -   [ ] **`updateJournalEntry`**: A tool that allows the LLM to propose specific, structured updates to a journal entry (e.g., `{"id": "xyz", "updates": {"payee": "New Payee"}}`).

-   [ ] **Testing:**
    -   [ ] Write unit tests for each tool to ensure it functions correctly.
    -   [ ] Write integration tests for the tool dispatcher to verify it can correctly route and execute tool calls.

## Phase 3: Frontend Configuration

This phase involves building the UI for managing LLM settings and viewing logs.

-   [ ] **LLM Settings Page:**
    -   [ ] Create a new route and Svelte page for LLM Configuration.
    -   [ ] Build components for CRUD operations on `llm_settings`.
    -   [ ] **Testing:** Write Playwright E2E tests to simulate user interaction with the settings page, using the mocked backend.

-   [ ] **LLM Log Viewer:**
    -   [ ] Create a new route and Svelte page for viewing `llm_logs`.
    -   [ ] Display logs in a table with a modal/expandable row for viewing full payloads.
    -   [ ] **Testing:** Write Playwright E2E tests for the log viewer.

## Phase 4: Feature 1 - Journal Entry Recommendation (Using Tools)

This phase implements the first core AI feature using the new tool-calling architecture.

-   [ ] **Extend Filter Functionality:**
    -   [ ] Add `llm_review_required` boolean to the `filters` table.
    -   [ ] Update the filter UI to include this option.

-   [ ] **Backend Recommendation Service (Refactored for Tools):**
    -   [ ] Create a service that identifies journal entries needing review.
    -   [ ] This service will orchestrate a multi-step conversation with the LLM, providing the journal data and the list of available tools.
    -   [ ] The LLM can then decide to call tools like `findSimilarJournalEntries` or `getInvoiceText` to gather context before making a final recommendation.

-   [ ] **Database for Suggestions:**
    -   [ ] Create `journal_llm_suggestions` table (id, journal_id, suggested_payee, suggested_description, status, llm_log_id).

-   [ ] **Frontend for Suggestions:**
    -   [ ] On the journal details page, display a "Suggestion Available" component showing original vs. suggested values.
    -   [ ] Include "Accept" and "Reject" buttons to update the journal and suggestion status.

-   [ ] **Testing:**
    -   [ ] Write integration tests for the recommendation service, mocking the LLM's tool-calling responses to test the application logic robustly.
    -   [ ] Write E2E tests for the suggestion UI.

## Phase 5: Feature 2 - Invoice/Image Recognition (Vision)

This phase extends the LLM functionality to handle image-based recognition.

-   [ ] **Update LLM Client & Tools for Vision:**
    -   [ ] Modify the `LLMClient` to handle multimodal (vision) requests.
    -   [ ] Create a new tool: `analyzeInvoiceImage(file_id: string)` that uses a vision model to extract vendor, amount, date, etc.

-   [ ] **Frontend Integration:**
    -   [ ] Add a "Scan with AI" button to the file/image attachment UI.
    -   [ ] This button will trigger the `analyzeInvoiceImage` tool and display the extracted data, allowing the user to apply it to the journal entry.

-   [ ] **Testing:**
    -   [ ] Update the mock `LLMClient` to handle vision model requests and responses.
    -   [ ] Write E2E tests for the "Scan with AI" feature.