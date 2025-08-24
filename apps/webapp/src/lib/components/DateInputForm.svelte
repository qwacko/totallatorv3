<script lang="ts" generics="T extends Record<string|number|symbol, unknown>">
	import type { ComponentProps } from 'svelte';
	import type { Writable } from 'svelte/store';
	import type { FormPathLeaves } from 'sveltekit-superforms';
	import { formFieldProxy, type SuperForm } from 'sveltekit-superforms';

	import DateInput from './DateInput.svelte';

	type DateInputProps = ComponentProps<typeof DateInput>;

	const {
		form,
		field,
		wrapperClass,
		title,
		highlightTainted = true,
		class: className = '',
		...restProps
	}: {
		form: SuperForm<T, unknown>;
		field: FormPathLeaves<T>;
		wrapperClass?: string;
		title: string | null;
		highlightTainted?: boolean;
		class?: string;
	} & Omit<
		DateInputProps,
		| 'title'
		| 'name'
		| 'value'
		| 'errorMessage'
		| 'tainted'
		| 'highlighTainted'
		| 'form'
		| 'field'
		| 'wrapperClass'
		| 'class'
	> = $props();

	const { value, errors, constraints, tainted } = formFieldProxy(form, field);

	const stringValue = $derived(value as Writable<string>);
</script>

<DateInput
	{title}
	name={field}
	bind:value={$stringValue}
	errorMessage={$errors}
	tainted={$tainted}
	{highlightTainted}
	aria-invalid={$errors ? 'true' : undefined}
	class={className}
	{wrapperClass}
	{...$constraints}
	{...restProps}
/>
