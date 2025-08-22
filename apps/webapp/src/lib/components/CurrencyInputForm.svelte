<script lang="ts" generics="T extends Record<string|number|symbol, unknown>">
	import type { ComponentProps } from 'svelte';
	import type { Writable } from 'svelte/store';
	import type { FormPathLeaves } from 'sveltekit-superforms';
	import { formFieldProxy, type SuperForm } from 'sveltekit-superforms';

	import CurrencyInput from './CurrencyInput.svelte';

	type CurrencyInputProps = ComponentProps<typeof CurrencyInput>;

	const {
		form,
		field,
		wrapperClass = undefined,
		title,
		highlightTainted = true,
		class: className = undefined,
		...restProps
	}: {
		form: SuperForm<T, unknown>;
		field: FormPathLeaves<T>;
		wrapperClass?: string | undefined;
		title: string | null;
		highlightTainted?: boolean | undefined;
		class?: string;
	} & Omit<
		CurrencyInputProps,
		'name' | 'form' | 'field' | 'wrapperClass' | 'title' | 'class'
	> = $props();

	const { value, errors, constraints, tainted } = formFieldProxy(form, field);

	const stringValue = $derived(value as Writable<number>);
</script>

<CurrencyInput
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
