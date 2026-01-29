# Fixed Examples for Svelte 5 + Runes Migration

This file shows before/after examples of fixing the closure warnings in your components.

---

## The Core Pattern

**The fix for all closure warnings is simple:**

```svelte
<script>
	const { prop1, prop2 } = $props();

	// ✅ Wrap function call with props
	const result = $derived(someFunction(prop1, prop2));

	// ✅ Wrap property access
	const value = $derived(result.someProperty);
</script>

<!-- In template, use variable directly (no $, no ()) --><div>{value}</div>
```

---

## Example 1: BooleanInputForm.svelte (Form Field Component)

### Before (❌ Warnings)

```svelte
<script lang="ts" generics="T extends Record<string|number|symbol, unknown>">
	import type { Writable } from 'svelte/store';
	import type { FormPathLeaves } from 'sveltekit-superforms';
	import { formFieldProxy, type SuperForm } from 'sveltekit-superforms';

	import BooleanFilterButtons from './filters/BooleanFilterButtons.svelte';

	const {
		form,
		field,
		wrapperClass = undefined,
		title,
		onTitle = 'True',
		offTitle = 'False',
		clearTitle = 'Clear',
		hideClear = false,
		disabled = false
	}: {
		form: SuperForm<T, unknown>;
		field: FormPathLeaves<T>;
		wrapperClass?: string;
		title?: string | null;
		onTitle?: string;
		offTitle?: string;
		clearTitle?: string;
		hideClear?: boolean;
		disabled?: boolean;
	} = $props();

	// ❌ Warning: This reference only captures the initial value of `form` and `field`
	const { value } = formFieldProxy(form, field);

	const booleanValue = $derived(value as Writable<boolean | undefined>);
</script>

<BooleanFilterButtons
	bind:value={$booleanValue}
	{title}
	{onTitle}
	{offTitle}
	{clearTitle}
	{hideClear}
	{wrapperClass}
	{disabled}
/>
<input type="hidden" name={field} value={$booleanValue} />
```

---

### After (✅ No Warnings)

```svelte
<script lang="ts" generics="T extends Record<string|number|symbol, unknown>">
	import type { Writable } from 'svelte/store';
	import type { FormPathLeaves } from 'sveltekit-superforms';
	import { formFieldProxy, type SuperForm } from 'sveltekit-superforms';

	import BooleanFilterButtons from './filters/BooleanFilterButtons.svelte';

	const {
		form,
		field,
		wrapperClass = undefined,
		title,
		onTitle = 'True',
		offTitle = 'False',
		clearTitle = 'Clear',
		hideClear = false,
		disabled = false
	}: {
		form: SuperForm<T, unknown>;
		field: FormPathLeaves<T>;
		wrapperClass?: string;
		title?: string | null;
		onTitle?: string;
		offTitle?: string;
		clearTitle?: string;
		hideClear?: boolean;
		disabled?: boolean;
	} = $props();

	// ✅ Wrap function call in $derived
	const fieldProxy = $derived(formFieldProxy(form, field));

	// ✅ Wrap property access
	const booleanValue = $derived(fieldProxy.value as Writable<boolean | undefined>);
</script>

<BooleanFilterButtons
	bind:value={booleanValue}
	{title}
	{onTitle}
	{offTitle}
	{clearTitle}
	{hideClear}
	{wrapperClass}
	{disabled}
/>
<input type="hidden" name={field} value={booleanValue} />
```

**Note:** In template, use `booleanValue` directly (no `$`, no `()`).

---

## Example 2: FilterModal.svelte (State from Props)

### Before (❌ Warning)

```svelte
<script
	lang="ts"
	generics="F extends JournalFilterSchemaType | JournalFilterSchemaWithoutPaginationType"
>
	import { Button, Modal } from 'flowbite-svelte';
	import type { Snippet } from 'svelte';

	import type {
		JournalFilterSchemaType,
		JournalFilterSchemaWithoutPaginationType
	} from '@totallator/shared';

	import FilterModalContent from './FilterModalContent.svelte';
	import FilterIcon from './icons/FilterIcon.svelte';

	let {
		currentFilter,
		urlFromFilter,
		opened = $bindable(false),
		hideDates = false,
		modalTitle = 'Journal Filter',
		slotFooterContents
	}: {
		currentFilter: F;
		urlFromFilter?: (filter: F) => string;
		opened?: boolean;
		hideDates?: boolean;
		modalTitle?: string;
		slotFooterContents?: Snippet<[{ activeFilter: F }]>;
	} = $props();

	let url = $state('');

	// ❌ Warning: This reference only captures the initial value of `currentFilter`
	let activeFilter = $state(currentFilter);
</script>

<Button color="light" onclick={() => (opened = true)}>
	<FilterIcon />
</Button>
<Modal bind:open={opened} size="lg" title={modalTitle} outsideclose>
	<FilterModalContent {currentFilter} {urlFromFilter} {hideDates} bind:url bind:activeFilter />
	{#snippet footer()}
		{#if slotFooterContents}
			{@render slotFooterContents({ activeFilter })}
		{:else}
			<Button onclick={() => (opened = false)} outline>Cancel</Button>
			<div class="grow"></div>
			<Button href={url}>Apply</Button>
		{/if}
	{/snippet}
</Modal>
```

---

### After (✅ No Warnings) - Option A: Just Use Derived

```svelte
<script
	lang="ts"
	generics="F extends JournalFilterSchemaType | JournalFilterSchemaWithoutPaginationType"
>
	import { Button, Modal } from 'flowbite-svelte';
	import type { Snippet } from 'svelte';

	import type {
		JournalFilterSchemaType,
		JournalFilterSchemaWithoutPaginationType
	} from '@totallator/shared';

	import FilterModalContent from './FilterModalContent.svelte';
	import FilterIcon from './icons/FilterIcon.svelte';

	let {
		currentFilter,
		urlFromFilter,
		opened = $bindable(false),
		hideDates = false,
		modalTitle = 'Journal Filter',
		slotFooterContents
	}: {
		currentFilter: F;
		urlFromFilter?: (filter: F) => string;
		opened?: boolean;
		hideDates?: boolean;
		modalTitle?: string;
		slotFooterContents?: Snippet<[{ activeFilter: F }]>;
	} = $props();

	let url = $state('');

	// ✅ If you just need reactivity, wrap in $derived
	let activeFilter = $derived(currentFilter);
</script>

<Button color="light" onclick={() => (opened = true)}>
	<FilterIcon />
</Button>
<Modal bind:open={opened} size="lg" title={modalTitle} outsideclose>
	<FilterModalContent {currentFilter} {urlFromFilter} {hideDates} bind:url bind:activeFilter />
	{#snippet footer()}
		{#if slotFooterContents}
			{@render slotFooterContents({ activeFilter })}
		{:else}
			<Button onclick={() => (opened = false)} outline>Cancel</Button>
			<div class="grow"></div>
			<Button href={url}>Apply</Button>
		{/if}
	{/snippet}
</Modal>
```

---

### After (✅ No Warnings) - Option B: Local State with Sync

```svelte
<script
	lang="ts"
	generics="F extends JournalFilterSchemaType | JournalFilterSchemaWithoutPaginationType"
>
	import { Button, Modal } from 'flowbite-svelte';
	import type { Snippet } from 'svelte';

	import type {
		JournalFilterSchemaType,
		JournalFilterSchemaWithoutPaginationType
	} from '@totallator/shared';

	import FilterModalContent from './FilterModalContent.svelte';
	import FilterIcon from './icons/FilterIcon.svelte';

	let {
		currentFilter,
		urlFromFilter,
		opened = $bindable(false),
		hideDates = false,
		modalTitle = 'Journal Filter',
		slotFooterContents
	}: {
		currentFilter: F;
		urlFromFilter?: (filter: F) => string;
		opened?: boolean;
		hideDates?: boolean;
		modalTitle?: string;
		slotFooterContents?: Snippet<[{ activeFilter: F }]>;
	} = $props();

	let url = $state('');

	// ✅ If you need to modify locally, create state
	let activeFilter = $state(structuredClone(currentFilter));

	// ✅ Sync when prop changes
	$effect(() => {
		activeFilter = structuredClone(currentFilter);
	});
</script>

<Button color="light" onclick={() => (opened = true)}>
	<FilterIcon />
</Button>
<Modal bind:open={opened} size="lg" title={modalTitle} outsideclose>
	<FilterModalContent {currentFilter} {urlFromFilter} {hideDates} bind:url bind:activeFilter />
	{#snippet footer()}
		{#if slotFooterContents}
			{@render slotFooterContents({ activeFilter })}
		{:else}
			<Button onclick={() => (opened = false)} outline>Cancel</Button>
			<div class="grow"></div>
			<Button href={url}>Apply</Button>
		{/if}
	{/snippet}
</Modal>
```

---

## Example 3: AutoImportForm.svelte (Multiple Fields)

### Before (❌ Many Warnings)

```svelte
<script lang="ts">
	import { Accordion, AccordionItem } from 'flowbite-svelte';

	import {
		autoImportFormItemDisplay,
		autoImportFrequencyEnumSelection,
		autoImportTypeDropdown
	} from '@totallator/shared';

	import BooleanFilterButtons from '$lib/components/filters/BooleanFilterButtons.svelte';
	import NumberInput from '$lib/components/NumberInput.svelte';
	import SelectInput from '$lib/components/SelectInput.svelte';
	import TextInput from '$lib/components/TextInput.svelte';
	import { importMappingDropdownData } from '$lib/stores/dropdownStores.js';

	import type { AutoImportFormProxy } from './autoImportFormProxy';

	const {
		proxyForm,
		disabled = false,
		lockType = false,
		hideEnabled = false,
		closeAccordian = false
	}: {
		proxyForm: AutoImportFormProxy;
		disabled?: boolean;
		lockType?: boolean;
		hideEnabled?: boolean;
		closeAccordian?: boolean;
	} = $props();

	// ❌ Warning: This reference only captures the initial value of `proxyForm` (repeated 15 times!)
	const { value: typeValue, errors: typeErrors } = proxyForm.type;
	const { value: titleValue, errors: titleErrors } = proxyForm.title;
	const { value: enabledValue } = proxyForm.enabled;
	const { value: importMappingIdValue, errors: importMappingIdErrors } = proxyForm.importMappingId;
	const { value: frequencyValue, errors: frequencyErrors } = proxyForm.frequency;
	const { value: accountIdValue, errors: accountIdErrors } = proxyForm.accountId;
	const { value: appAccessTokenValue, errors: appAccessTokenErrors } = proxyForm.appAccessToken;
	const { value: appIdValue, errors: appIdErrors } = proxyForm.appId;
	const { value: connectionIdValue, errors: connectionIdErrors } = proxyForm.connectionId;
	const { value: secretValue, errors: secretErrors } = proxyForm.secret;
	const { value: userAccessTokenValue, errors: userAccessTokenErrors } = proxyForm.userAccessToken;
	const { value: lookbackDaysValue, errors: lookbackDaysErrors } = proxyForm.lookbackDays;
	const { value: startDateValue, errors: startDateErrors } = proxyForm.startDate;
	const { value: autoProcessValue } = proxyForm.autoProcess;
	const { value: autoCleanValue } = proxyForm.autoClean;

	const formElements = $derived(autoImportFormItemDisplay[$typeValue]);
</script>
```

---

### After (✅ No Warnings)

```svelte
<script lang="ts">
	import { Accordion, AccordionItem } from 'flowbite-svelte';

	import {
		autoImportFormItemDisplay,
		autoImportFrequencyEnumSelection,
		autoImportTypeDropdown
	} from '@totallator/shared';

	import BooleanFilterButtons from '$lib/components/filters/BooleanFilterButtons.svelte';
	import NumberInput from '$lib/components/NumberInput.svelte';
	import SelectInput from '$lib/components/SelectInput.svelte';
	import TextInput from '$lib/components/TextInput.svelte';
	import { importMappingDropdownData } from '$lib/stores/dropdownStores.js';

	import type { AutoImportFormProxy } from './autoImportFormProxy';

	const {
		proxyForm,
		disabled = false,
		lockType = false,
		hideEnabled = false,
		closeAccordian = false
	}: {
		proxyForm: AutoImportFormProxy;
		disabled?: boolean;
		lockType?: boolean;
		hideEnabled?: boolean;
		closeAccordian?: boolean;
	} = $props();

	// ✅ Wrap each property access in $derived
	const typeValue = $derived(proxyForm.type.value);
	const titleValue = $derived(proxyForm.title.value);
	const enabledValue = $derived(proxyForm.enabled.value);
	const importMappingIdValue = $derived(proxyForm.importMappingId.value);
	const frequencyValue = $derived(proxyForm.frequency.value);
	const accountIdValue = $derived(proxyForm.accountId.value);
	const appAccessTokenValue = $derived(proxyForm.appAccessToken.value);
	const appIdValue = $derived(proxyForm.appId.value);
	const connectionIdValue = $derived(proxyForm.connectionId.value);
	const secretValue = $derived(proxyForm.secret.value);
	const userAccessTokenValue = $derived(proxyForm.userAccessToken.value);
	const lookbackDaysValue = $derived(proxyForm.lookbackDays.value);
	const startDateValue = $derived(proxyForm.startDate.value);
	const autoProcessValue = $derived(proxyForm.autoProcess.value);
	const autoCleanValue = $derived(proxyForm.autoClean.value);

	const typeErrors = $derived(proxyForm.type.errors);
	const titleErrors = $derived(proxyForm.title.errors);
	const importMappingIdErrors = $derived(proxyForm.importMappingId.errors);
	const frequencyErrors = $derived(proxyForm.frequency.errors);
	const accountIdErrors = $derived(proxyForm.accountId.errors);
	const appAccessTokenErrors = $derived(proxyForm.appAccessToken.errors);
	const appIdErrors = $derived(proxyForm.appId.errors);
	const connectionIdErrors = $derived(proxyForm.connectionId.errors);
	const secretErrors = $derived(proxyForm.secret.errors);
	const userAccessTokenErrors = $derived(proxyForm.userAccessToken.errors);
	const lookbackDaysErrors = $derived(proxyForm.lookbackDays.errors);
	const startDateErrors = $derived(proxyForm.startDate.errors);

	const formElements = $derived(autoImportFormItemDisplay[$typeValue]);
</script>

<!-- Usage in template -->
<div>
	<TextInput title="Type" bind:value={typeValue} errorMessage={typeErrors} />
	<TextInput title="Title" bind:value={titleValue} errorMessage={titleErrors} />
	<!-- ... more inputs -->
</div>
```

**Note:** In template, use `typeValue`, `titleValue`, etc. directly (no `()`).

---

## Example 4: Route Page with superForm

### Before (❌ Warning)

```svelte
<script lang="ts">
	import { superForm } from 'sveltekit-superforms';

	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();

	// ❌ Warning: This reference only captures the initial value of `data`
	const { form, errors, constraints, message, enhance } = superForm(data.form);
</script>

<form method="POST" use:enhance>
	<!-- form fields -->
</form>
```

---

### After (✅ No Warnings)

```svelte
<script lang="ts">
	import { superForm } from 'sveltekit-superforms';

	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();

	// ✅ Wrap function call in $derived
	const formResult = $derived(superForm(data.form));

	// ✅ Access properties
	const form = $derived(formResult.form);
	const errors = $derived(formResult.errors);
	const constraints = $derived(formResult.constraints);
	const message = $derived(formResult.message);
	const enhance = $derived(formResult.enhance);
</script>

<form method="POST" use:enhance>
	<input bind:value={form.name} />
	{#if errors.name}
		<div class="error">{errors.name}</div>
	{/if}
</form>
```

---

## Example 5: SmartJsonViewer.svelte (Derived from Props)

### Before (❌ Warning)

```svelte
<script lang="ts">
	let { defaultExpanded, level }: { defaultExpanded: boolean; level: number } = $props();

	// ❌ Warning: This reference only captures the initial value of `defaultExpanded`
	let isExpanded = $state(defaultExpanded);

	// ❌ Warning: This reference only captures the initial value of `level`
	const maxIndent = 3; // Maximum 3rem indentation
	const indent = Math.min(level * 0.75, maxIndent);
</script>
```

---

### After (✅ No Warnings)

```svelte
<script lang="ts">
	let { defaultExpanded, level }: { defaultExpanded: boolean; level: number } = $props();

	// ✅ Wrap prop in $derived
	let isExpanded = $derived(defaultExpanded);

	// ✅ Wrap computation in $derived
	const maxIndent = 3; // Maximum 3rem indentation
	const indent = $derived(Math.min(level * 0.75, maxIndent));
</script>
```

---

## Quick Migration Checklist

For each component with warnings:

1. ✅ Identify which props are being accessed directly in functions or property chains
2. ✅ Wrap function calls with props in `$derived(...)`
3. ✅ Wrap property accesses on derived objects in `$derived(...)`
4. ✅ Update template to use variable directly (no `$`, no `()`)
5. ✅ Test that reactivity still works
6. ✅ Run `pnpm check` to verify warning is gone

---

## Common Patterns & Solutions

| Pattern                                         | Warning                                    | Solution                                                                                                    |
| ----------------------------------------------- | ------------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| `const { value } = formFieldProxy(form, field)` | "captures initial value of `form`/`field`" | Wrap: `const fieldProxy = $derived(formFieldProxy(form, field)); const value = $derived(fieldProxy.value);` |
| `let local = $state(prop)`                      | "captures initial value of `prop`"         | Use derived: `let local = $derived(prop);` OR use `$state` + `$effect` for local mutation                   |
| `const form = superForm(data.form)`             | "captures initial value of `data`"         | Wrap: `const form = $derived(superForm(data.form));`                                                        |
| `const { value } = proxyForm.type` (repeated)   | "captures initial value of `proxyForm`"    | Wrap each: `const value = $derived(proxyForm.type.value);`                                                  |
| `const processed = processData(data)`           | "captures initial value of `data`"         | Wrap: `const processed = $derived(() => processData(data));`                                                |

---

## Important Notes

### In Templates

```svelte
<!-- ✅ CORRECT - use variable directly -->
<div>{myValue}</div>
<input value={myValue} />

<!-- ❌ WRONG - don't use $ prefix -->
<div>{$myValue}</div>

<!-- ❌ WRONG - don't use () unless it's a function -->
<div>{myValue()}</div>
```

### Why This Works

Svelte 5's `$derived` automatically tracks all dependencies accessed inside it:

```typescript
// This tracks prop1, prop2, functionResult, and .property
const value = $derived(someFunction(prop1, prop2).property);
```

If any dependency changes, `$derived` knows to recompute.

---

Generated: 2025-01-28
