<script lang="ts" module>
	import type { IDRecord, OptionFunction, DisplayFunction } from './ComboSelectTypes';
</script>

<script lang="ts" generics="T extends Record<string|number|symbol, unknown>, U extends IDRecord">
	import type { Writable } from 'svelte/store';

	import type { FormPathLeaves } from 'sveltekit-superforms';
	import { formFieldProxy, type SuperForm } from 'sveltekit-superforms';

	import ComboSelect from './ComboSelect.svelte';

	let {
		form,
		field,
		clearField,
		placeholder = 'Select Item...',
		highlightSearch = true,
		title,
		highlightTainted = true,
		clearValue = $bindable(),
		createField,
		createValue = $bindable(),
		createDesc = 'Create',
		clearable = false,
		items,
		itemToOption,
		itemToDisplay
	}: {
		form: SuperForm<T, unknown>;
		field: FormPathLeaves<T>;
		clearField?: FormPathLeaves<T>;
		placeholder?: string;
		highlightSearch?: boolean;
		title: string | null | undefined;
		highlightTainted?: boolean;
		clearValue?: boolean;
		createField?: FormPathLeaves<T>;
		createValue?: string | null;
		createDesc?: string;
		clearable?: boolean;
		items?: Promise<U[]> | U[];
		itemToOption: OptionFunction<U>;
		itemToDisplay: DisplayFunction<U>;
	} = $props();

	const { value, tainted } = formFieldProxy(form, field);

	const stringValue = $derived(value as Writable<string | undefined>);
	const inClearable = $derived(clearField !== undefined || clearable);
	const creatable = $derived(createField !== undefined);
</script>

{#await items then resolvedItems}
	<ComboSelect
		bind:value={$stringValue}
		{title}
		clearable={inClearable}
		{creatable}
		{placeholder}
		{createDesc}
		items={resolvedItems}
		{itemToOption}
		{itemToDisplay}
		tainted={$tainted}
		name={field}
		clearName={clearField}
		createName={createField}
		bind:clearValue
		bind:createValue
		{highlightTainted}
		{highlightSearch}
	/>
{/await}
