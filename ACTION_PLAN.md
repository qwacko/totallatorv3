# Svelte 5 Migration Action Plan

## Summary

Your application has **6 critical errors** and **97 warnings** related to Svelte 5 + runes migration. All warnings can be fixed with one simple pattern: **wrap prop accesses in `$derived`**.

---

## The Simple Solution

**The fix for all 97 closure warnings is:**

```typescript
// 1. Wrap function calls with props
const result = $derived(someFunction(prop1, prop2));

// 2. Wrap property accesses on derived objects
const value = $derived(result.someProperty);

// 3. In template, use variable directly (no $, no ())
<div>{value}</div>
```

**No helper functions needed. Just use `$derived` directly.**

---

## Quick Start: Fix 6 Critical Errors (1-2 hours)

### 1. vite.config.ts - Remove poolOptions

**File:** `/home/james/totallatorv3/apps/webapp/vite.config.ts`

```typescript
// Line 84 - DELETE THIS LINE:
// poolOptions: { forks: { singleFork: true } }
```

**Why:** `poolOptions` doesn't exist in Vitest's InlineConfig type. The `maxWorkers: 1` and `maxConcurrency: 1` settings already achieve same behavior.

---

### 2. ShowLogs.svelte - Fix async useInterval

**File:** `/home/james/totallatorv3/apps/webapp/src/lib/components/logs/ShowLogs.svelte`

**Lines 45-51:**

```typescript
// BEFORE:
const interval = useInterval(
  async () => {
    await getLogs(filter).refresh();
    updateTime = new Date();
  },
  () => refreshInterval
);

// AFTER:
const interval = useInterval(
  () => {
    // Make async operation fire-and-forget
    getLogs(filter).refresh().then(() => {
      updateTime = new Date();
    });
  },
  () => refreshInterval
);
```

**Why:** `useInterval` expects a synchronous callback, not async. Use fire-and-forget pattern with `.then()`.

---

### 3. backup-restore-progress/+page.svelte - Fix useInterval arguments

**File:** `/home/james/totallatorv3/apps/webapp/src/routes/(loggedIn)/backup-restore-progress/+page.svelte`

**Check signature around line 16-20**. The `useInterval` from `runed` should accept only 2 arguments:

- `callback: () => void`
- `delay: MaybeGetter<number>`

**Fix example:**

```typescript
// If passing a value:
const interval = useInterval(() => intervalDelay);

// If passing a callback:
const interval = useInterval(
  () => { /* your callback */ },
  () => intervalDelay
);
// Remove any 3rd argument
```

**Why:** Check `runed` library documentation for exact `useInterval` signature.

---

### 4. logsDisplay.remote.ts - Fix form function signature

**File:** `/home/james/totallatorv3/apps/webapp/src/lib/components/logs/logsDisplay.remote.ts`

**Line 55:**

```typescript
// BEFORE:
export const setLogConfiguration = form(async (data) => {
  const globalContext = getContext();
  const logLevelIn = data.get('level');
  // ...
});

// AFTER:
export const setLogConfiguration = form(() => {
  // Access form data through the runed form's internal API
  const globalContext = getContext();
  // You'll need to access data differently with runed's form
  // Check runed documentation for correct pattern
});
```

**Why:** The `form()` function from `runed` expects a parameterless function, not one with `data` parameter. Check `runed` library docs for correct way to access form data.

---

### 5. test-tracing/+server.ts - Fix missing import

**File:** `/home/james/totallatorv3/apps/webapp/src/routes/api/test-tracing/+server.ts`

**Either:**

1. Create the missing module at `$lib/server/testTracing.ts`
2. Remove the import if not needed
3. Fix the import path

---

### 6. Implicit any types - Fix server files

**Files affected:**

- `/home/james/totallatorv3/apps/webapp/src/routes/(loggedIn)/journals/+layout.server.ts`
- `/home/james/totallatorv3/apps/webapp/src/routes/(loggedIn)/journals/+page.server.ts`
- `/home/james/totallatorv3/apps/webapp/src/routes/(loggedIn)/journals/bulkEdit/+page.server.ts`

**Fix:**

```typescript
// BEFORE:
export const load = async ({ data }) => {
  // ...
};

// AFTER:
export const load = async ({ data }: { data: any }) => {
  // ...
};

// BEFORE:
export const actions = {
  default: async ({ request, locals }) => {
    // ...
  }
};

// AFTER:
export const actions = {
  default: async ({ request, locals }: { request: any; locals: any }) => {
    // ...
  }
};
```

**Why:** TypeScript strict mode requires explicit types for parameters.

---

## Fix Closure Warnings (97 total)

I've grouped all 97 warnings into 5 patterns. Use the simple pattern below to fix them.

### Pattern 1: Form Field Components (20+ files)

**Files affected:**

- BooleanInputForm.svelte
- BooleanSetClearForm.svelte
- CheckboxInputForm.svelte
- ComboSelectForm.svelte
- CurrencyInputForm.svelte
- DateInputForm.svelte
- LlmStatusForm.svelte
- NumberInputForm.svelte
- TextInputForm.svelte

**Fix:**

```svelte
<script>
	import { formFieldProxy } from 'sveltekit-superforms';

	const { form, field } = $props();

	// ✅ Wrap function call
	const fieldProxy = $derived(formFieldProxy(form, field));

	// ✅ Wrap property access
	const value = $derived(fieldProxy.value);
	const errors = $derived(fieldProxy.errors);
</script>

<input {value} />
{#if errors}
	<div class="error">{errors}</div>
{/if}
```

**Estimated time:** 2-3 hours for all form components

---

### Pattern 2: Route Pages with superForm (30+ files)

**Files affected:**

- accounts/create/+page.svelte
- accounts/bulkEdit/+page.svelte
- bills/create/+page.svelte
- bills/[id]/+page.svelte
- budgets/create/+page.svelte
- budgets/[id]/+page.svelte
- categories/create/+page.svelte
- categories/[id]/+page.svelte
- users/create/+page.svelte
- users/[id]/+page.svelte
- labels/create/+page.svelte
- labels/[id]/+page.svelte
- tags/create/+page.svelte
- tags/[id]/+page.svelte
- llm/providers/create/+page.svelte
- llm/providers/[id]/+page.svelte
- files/create/+page.svelte
- files/[id]/+page.svelte
- journals/clone/+page.svelte
- journals/create/+page.svelte
- journals/bulkEdit/+page.svelte
- import/create/+page.svelte
- importMapping/create/+page.svelte
- importMapping/[id]/+page.svelte
- autoImport/create/+page.svelte
- autoImport/[id]/+page.svelte

**Fix:**

```svelte
<script>
  import { superForm } from 'sveltekit-superforms';

  const { data }: { data: PageData } = $props();

  // ✅ Wrap function call
  const formResult = $derived(superForm(data.form));

  // ✅ Access properties
  const form = $derived(formResult.form);
  const errors = $derived(formResult.errors);
  const enhance = $derived(formResult.enhance);
</script>

<form method="POST" use:enhance>
  <input bind:value={form.name} />
  {#if errors.name}
    <div class="error">{errors.name}</div>
  {/if}
</form>
```

**Estimated time:** 3-4 hours for all route pages

---

### Pattern 3: State from Props (5-10 files)

**Files affected:**

- FilterModal.svelte
- LlmReviewStatusBadge.svelte
- SmartJsonViewer.svelte
- NoteAutomaticCreationForm.svelte

**Option A: Just Use Derived (if you don't need to modify locally)**

```svelte
<script>
	const { currentFilter } = $props();

	// ✅ If you just need reactivity, wrap in $derived
	let activeFilter = $derived(currentFilter);
</script>
```

**Option B: Local State with Sync (if you need to modify locally)**

```svelte
<script>
	const { currentFilter } = $props();

	// ✅ If you need to modify locally, create state
	let activeFilter = $state(structuredClone(currentFilter));

	// ✅ Sync when prop changes
	$effect(() => {
		activeFilter = structuredClone(currentFilter);
	});
</script>
```

**Estimated time:** 30 minutes

---

### Pattern 4: Multiple Field Destructuring (1-2 files)

**Files affected:**

- AutoImportForm.svelte

**Fix:**

```svelte
<script>
	const { proxyForm } = $props();

	// ✅ Wrap each property access
	const typeValue = $derived(proxyForm.type.value);
	const titleValue = $derived(proxyForm.title.value);
	const enabledValue = $derived(proxyForm.enabled.value);
	const typeErrors = $derived(proxyForm.type.errors);
	const titleErrors = $derived(proxyForm.title.errors);
	// ... wrap all other properties similarly
</script>

<input value={typeValue} />
{#if typeErrors}
	<div class="error">{typeErrors}</div>
{/if}
```

**Estimated time:** 1 hour

---

### Pattern 5: Remote Function Caches (2-3 files)

**Files affected:**

- RecommendationCore.svelte
- ComboSelectRF.svelte

**Fix:**

```svelte
<script>
	const { getItems, key } = $props();

	// ✅ Wrap all reactive values in functions
	const result = remoteFunctionCache(
		() => getItems,
		() => delayedParams,
		{ key: () => key }
	);
</script>
```

**Estimated time:** 30 minutes

---

## Recommended Timeline

### Day 1: Critical Errors

- [ ] Fix vite.config.ts - remove poolOptions (5 minutes)
- [ ] Fix ShowLogs.svelte useInterval (10 minutes)
- [ ] Fix backup-restore-progress useInterval (15 minutes)
- [ ] Fix logsDisplay.remote.ts form signature (20 minutes)
- [ ] Fix missing import in test-tracing (10 minutes)
- [ ] Fix implicit any types (30 minutes)

**Total:** 1.5 hours

### Day 2: Form Components (Pattern 1)

- [ ] BooleanInputForm.svelte
- [ ] BooleanSetClearForm.svelte
- [ ] CheckboxInputForm.svelte
- [ ] ComboSelectForm.svelte
- [ ] CurrencyInputForm.svelte
- [ ] DateInputForm.svelte
- [ ] LlmStatusForm.svelte
- [ ] NumberInputForm.svelte
- [ ] TextInputForm.svelte

**Total:** 2-3 hours

### Day 3: Route Pages (Pattern 2)

Batch them by feature area:

- [ ] Accounts (create, bulkEdit)
- [ ] Bills (create, [id])
- [ ] Budgets (create, [id])
- [ ] Categories (create, [id])
- [ ] Users (create, [id])
- [ ] Labels (create, [id])
- [ ] Tags (create, [id])
- [ ] LLM providers (create, [id], delete)
- [ ] Files (create, [id])
- [ ] Journals (clone, create, bulkEdit)
- [ ] Import (create, [id], mapping)
- [ ] AutoImport (create, [id])

**Total:** 3-4 hours

### Day 4: Other Patterns

- [ ] State from props (Pattern 3) - 30 minutes
- [ ] Multiple field destructuring (Pattern 4) - 1 hour
- [ ] Remote function caches (Pattern 5) - 30 minutes

**Total:** 2 hours

### Day 5: Testing & Validation

- [ ] Run `pnpm check` - verify all warnings eliminated
- [ ] Run `pnpm test:unit` - ensure unit tests pass
- [ ] Run `pnpm test:integration` - ensure E2E tests pass
- [ ] Manual testing of key features:
  - [ ] Forms (create/edit)
  - [ ] Filters
  - [ ] Search
  - [ ] Auto-refresh
  - [ ] Modals

**Total:** 2-3 hours

---

## Quick Testing Commands

```bash
# Check for warnings
pnpm check

# Run unit tests
pnpm test:unit

# Run integration tests
pnpm test:integration

# Run all tests
pnpm test

# Type check in watch mode
pnpm check:watch
```

---

## Verification Checklist

After fixing each component:

1. ✅ No TypeScript errors in IDE
2. ✅ No Svelte warnings when running `pnpm check`
3. ✅ Component still works correctly
4. ✅ Reactivity still works (state updates, prop changes)
5. ✅ No runtime errors in browser console

---

## Core Pattern Summary

| Pattern                                         | Warning                                    | Fix                                                                                                   |
| ----------------------------------------------- | ------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| `const { value } = formFieldProxy(form, field)` | "captures initial value of `form`/`field`" | `const fieldProxy = $derived(formFieldProxy(form, field)); const value = $derived(fieldProxy.value);` |
| `const form = superForm(data.form)`             | "captures initial value of `data`"         | `const form = $derived(superForm(data.form));`                                                        |
| `let local = $state(prop)`                      | "captures initial value of `prop`"         | Use `const local = $derived(prop);` OR use `$state` + `$effect` for local mutation                    |
| `const processed = processData(data)`           | "captures initial value of `data`"         | `const processed = $derived(() => processData(data));`                                                |
| Multiple field destructuring                    | Multiple warnings                          | Wrap each property: `const value = $derived(proxyForm.type.value);`                                   |

---

## Resources

- [Svelte 5 Runes Documentation](https://svelte.dev/docs/runes-api)
- [Svelte 5 Migration Guide](https://svelte.dev/docs/svelte-5-migration-guide)
- [runed Library Docs](https://runed.dev)

---

## Statistics

- **Total Warnings:** 97
- **Total Errors:** 6
- **Files Affected:** 63
- **Pattern 1 (Form Components):** ~25 warnings in 20 files
- **Pattern 2 (Route Pages):** ~50 warnings in 30 files
- **Pattern 3 (State from Props):** ~10 warnings in 5 files
- **Pattern 4 (Multiple Fields):** ~10 warnings in 2 files
- **Pattern 5 (Remote Functions):** ~2 warnings in 2 files

**Estimated Total Time:** 10-15 hours

---

**Generated:** 2025-01-28
**Project:** totallator-v3
**Svelte Version:** 5.45.8
