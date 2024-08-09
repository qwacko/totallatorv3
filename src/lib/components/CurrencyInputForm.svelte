<script lang="ts" generics="T extends Record<string|number|symbol, unknown>">
	import CurrencyInput from './CurrencyInput.svelte';

	import type { Writable } from 'svelte/store';

	import type { FormPathLeaves } from 'sveltekit-superforms';
	import { formFieldProxy, type SuperForm } from 'sveltekit-superforms';
	import type { ComponentProps } from 'svelte';

	type CurrencyInputProps = ComponentProps<CurrencyInput>;

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
	} & Omit<CurrencyInputProps, 'name'> = $props();

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
	on:blur
	on:keypress
	{...$constraints}
	{...restProps}
/>
