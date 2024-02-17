<script lang="ts" context="module">
	import type { AnyZodObject } from 'zod';
	import type { IDRecord, OptionFunction, DisplayFunction } from './ComboSelectTypes';
</script>

<script lang="ts" generics="T extends AnyZodObject, U extends IDRecord">
	import type { Writable } from 'svelte/store';

	import type { z } from 'zod';
	import type { ZodValidation, FormPathLeaves } from 'sveltekit-superforms';
	import { formFieldProxy, type SuperForm } from 'sveltekit-superforms/client';

	import ComboSelect from './ComboSelect.svelte';

	export let form: SuperForm<ZodValidation<T>, unknown>;
	export let field: FormPathLeaves<z.infer<T>>;
	export let clearField: FormPathLeaves<z.infer<T>> | undefined = undefined;
	export let placeholder = 'Select Item...';
	export let highlightSearch = true;
	export let title: string | null | undefined;
	export let highlightTainted: boolean | undefined = true;
	export let clearValue: boolean | undefined = undefined;
	export let createField: FormPathLeaves<z.infer<T>> | undefined = undefined;
	export let createValue: string | undefined | null = undefined;
	export let createDesc = 'Create';
	export let clearable = false;

	export let items: Promise<U[]> | U[];
	export let itemToOption: OptionFunction<U>;
	export let itemToDisplay: DisplayFunction<U>;

	const { value, tainted } = formFieldProxy(form, field);

	$: stringValue = value as Writable<string | undefined>;
	$: inClearable = clearField !== undefined || clearable;
	$: creatable = createField !== undefined;
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
