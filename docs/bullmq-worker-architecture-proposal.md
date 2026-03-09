# BullMQ worker + long-running process architecture proposal

## Why this proposal

You already have a partial BullMQ setup in place, but there are currently two parallel implementations:

- A webapp-local BullMQ setup (`setup.ts` + `bullmqService.ts`) that registers processors and starts a worker inside the SvelteKit process.
- A newer shared package abstraction (`packages/bullmq`) with a registry + `WorkerFactory`, plus a webapp integration attempt in `bullmqService.new.ts`.

This proposal recommends converging on one implementation and introducing a **typed job state model** that supports:

1. Timed jobs (cron-like scheduling)
2. Background jobs (fire-and-forget)
3. Long-running processors (LLM, imports, backups)
4. Frontend progress/lock visibility using SSE
5. Write-mutation blocking while a global long process lock is active

---

## Current state (what exists now)

### BullMQ foundations

- Shared package exists with reusable worker primitives:
  - `WorkerFactory` and redis connection lifecycle
  - `workerRegistry` for processors
  - base job typings and metadata
- Webapp has a test processor already registered in `jobProcessors/testJob.ts`.

### Initialization

- `hooks.server.ts` initializes cron service on server startup via `initializeNewCronService(globalContext)`.
- `newCronService.ts` then initializes BullMQ service.

### Operational UI

- Admin page for queue status exists at `/(loggedIn)/admin/bullmq`.

### Existing long-running UX

- Backup restore already has a dedicated progress page, currently refreshed on an interval (polling), not SSE.

### Gaps/risk areas

1. **Two competing BullMQ service implementations** (`bullmqService.ts` and `bullmqService.new.ts`).
2. Worker lifecycle is still coupled to web startup.
3. No generic cross-feature typed “long-running operation” contract.
4. No centralized mutation guard that blocks writes while allowing reads.
5. No SSE pipeline for real-time progress/event updates.

---

## Target architecture

## 1) Single queue/worker abstraction (shared package first)

Adopt `packages/bullmq` as the only BullMQ core and retire old webapp-specific setup.

### Queue domains (recommended)

- `cron` queue: scheduled recurrent jobs
- `background` queue: medium async work
- `long-running` queue: expensive CPU/network jobs (LLM, imports, restores)

Optional later:

- `notifications` queue for user-facing fanout work

### Job naming convention

Use namespaced types:

- `cron.refresh-materialized-views`
- `background.auto-import.sync`
- `long.llm.report-summarize`
- `long.backup.restore`

This simplifies permissions, observability, and concurrency tuning by prefix.

---

## 2) Deployment model: separate Dockerfiles per runtime

Given your latest preference, this proposal now recommends **separate Dockerfiles** for clarity and easy future split/deploy:

- `apps/webapp/Dockerfile` → SvelteKit web runtime
- `apps/worker/Dockerfile` (or `apps/webapp-worker/Dockerfile`) → BullMQ worker runtime

### Why this is a better default here

- Cleaner operational model (each container has one responsibility).
- Simpler scaling (`web` and `worker` replicas tuned independently).
- Cleaner startup/liveness semantics.
- Easier CI/CD promotion and rollback per runtime.

### Build strategy

- Keep shared package build in a common builder stage pattern.
- Reuse the same workspace output but produce role-specific runtime images.
- Keep environment variables aligned through shared schema (`serverEnv`) while allowing role-specific variables.

---

## 3) Type-safe job contract (single interface strategy)

To keep things type-safe end-to-end, define all jobs through one shared contract map in `packages/bullmq`.

### Proposed pattern

Define a `JobMap` shape where each job key maps to strongly typed `data` and `result`:

- `JobMap['long.backup.restore'].data`
- `JobMap['long.backup.restore'].result`

Then enforce typing in both producer and processor APIs:

- `enqueue<K extends keyof JobMap>(type: K, data: JobMap[K]['data'])`
- `registerProcessor<K extends keyof JobMap>(type: K, processor: Processor<JobMap[K]>)`

### Benefits

- Producers and consumers cannot drift.
- Refactors are compile-time safe.
- Future LLM tasks can define rich typed payloads (prompt IDs, provider config, expected artifact types).

---

## 4) Long-running process state model in Redis

Use Redis as source-of-truth for transient execution state.

### Suggested keys

- `totallator:lock:global-write`
  - JSON value: `{ jobId, type, startedAt, owner, expiresAt, reason }`
  - TTL required (safety against dead worker)
- `totallator:job:<jobId>:state`
  - JSON value: `{ status, progress, message, startedAt, updatedAt, metadata }`
  - TTL after completion/failure (e.g. 24h)
- `totallator:events:jobs` (pub/sub channel)
  - emit progress transitions for SSE subscribers

### Why this model

- Fast and ephemeral
- Good fit for lock semantics + heartbeats
- Decouples runtime status from persistent DB schema

(If you later need historical analytics/audits, also persist final summary rows to SQL.)

---

## 5) Mutation blocking strategy

Implement a **write guard** in SvelteKit hook/action wrapper:

- Reads (`GET`, pure queries) continue.
- Writes (`POST/PUT/PATCH/DELETE` + server actions that mutate) check Redis lock.
- If lock is active and caller is not privileged override, reject with `423 Locked` and structured payload.

### Placement

- Centralized helper used by:
  - `hooks.server.ts` for API/method-level guard
  - form-action wrappers where needed for finer control

### Important

- Guard should be feature-flagged initially (e.g. `ENABLE_GLOBAL_WRITE_LOCK=true`) to allow gradual rollout.

---

## 6) SSE for real-time frontend status

Introduce a server endpoint:

- `GET /api/system/long-process/stream`

Behavior:

- Server subscribes to Redis pub/sub (`totallator:events:jobs`).
- Emits SSE events:
  - `lock-acquired`
  - `lock-heartbeat`
  - `progress`
  - `completed`
  - `failed`
  - `lock-released`

Frontend:

- Use `EventSource` in root layout/store.
- Show a global banner/toast when lock active.
- Disable mutation UI controls while lock active (defense in depth; backend guard still authoritative).

Fallback:

- Keep poll endpoint for environments where SSE is not viable behind proxy, then degrade gracefully.

---

## 7) Job lifecycle contract

Standardize helper utilities in webapp/server package:

- `startLongJob(type, metadata)`
  - creates job state + acquires lock
- `updateLongJob(jobId, progress, message)`
  - updates Redis state + publishes event
- `finishLongJob(jobId, result)`
  - marks success/failure, releases lock, publishes final event
- heartbeat timer for lock extension while active

Make these mandatory for all processors in `long-running` queue.

---

## 8) Migration plan (incremental, low risk)

### Phase 1 — Converge foundations

1. Remove duplication by selecting `bullmqService.new.ts` path as canonical.
2. Rename/move it to `bullmqService.ts` and delete old implementation.
3. Introduce typed `JobMap` + strongly typed enqueue/register helpers in `packages/bullmq`.

### Phase 2 — Split runtime images

1. Add `apps/webapp/Dockerfile` for web runtime.
2. Add worker Dockerfile (`apps/worker/Dockerfile` or similar) for BullMQ runtime.
3. Update compose/deploy manifests to run web and worker separately.

### Phase 3 — Introduce lock + state API

1. Add Redis-backed long-process state helper module.
2. Add mutation guard in hooks/form wrapper.
3. Add first long task migration (backup restore) to new lifecycle helpers.

### Phase 4 — SSE + UI integration

1. Build `/api/system/long-process/stream` SSE endpoint.
2. Add frontend global store + banner component.
3. Connect backup restore progress UI to SSE events (poll fallback retained).

### Phase 5 — Move additional processors

1. Migrate timed cron callbacks to BullMQ repeatable jobs.
2. Move background/long workloads (imports, future LLM tasks).
3. Add queue-specific concurrency + rate limits.

### Phase 6 — Hardening

1. Add dead-letter behavior and retry policy by job type.
2. Add structured observability (job IDs in logs/traces).
3. Add runbooks for stuck lock recovery.

---

## Implementation notes for future LLM tasks

For LLM workloads specifically:

- Put them in `long-running` queue with strict concurrency.
- Track token/cost metadata in job state.
- Add cancellation support (set `cancelRequested` in Redis; processor checks cooperatively).
- Enforce max runtime and max retries per model/provider.
- Use typed job payloads/results for provider/tool-specific data.

---

## Suggested acceptance criteria

1. Web and worker run from separate Dockerfiles/images.
2. At least one existing long process migrated to BullMQ lifecycle helpers.
3. Global write lock blocks mutations with clear user messaging.
4. Frontend receives live status via SSE when long process is active.
5. Typed job contracts are enforced at compile time for enqueue + process paths.

---

## Recommendation summary

Yes—this is a good direction, and your current partial implementation is a strong starting point.

The best path is to:

1. Consolidate onto the shared `packages/bullmq` implementation.
2. Introduce a typed shared job interface (`JobMap`) used by both producers and processors.
3. Add Redis-backed long-job state + global write lock.
4. Expose status through SSE for UX and operator visibility.
5. Split web and worker runtimes into separate Dockerfiles/images.

This gives you a stable, type-safe foundation for future LLM/background work and keeps deployment simple to evolve.
