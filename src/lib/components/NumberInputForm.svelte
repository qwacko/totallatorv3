<script lang="ts" generics="T extends Record<string|number|symbol, unknown>">
	import NumberInput from './NumberInput.svelte';

	import type { Writable } from 'svelte/store';

	import type { FormPathLeaves } from 'sveltekit-superforms';
	import { formFieldProxy, type SuperForm } from 'sveltekit-superforms';

	export let form: SuperForm<T, unknown>;
	export let field: FormPathLeaves<T>;
	export let wrapperClass: string | undefined = undefined;
	export let title: string | null;
	export let highlightTainted: boolean | undefined = true;
	export let numberDecimals: 0 | 1 | 2 = 0;

	const { value, errors, constraints, tainted } = formFieldProxy(form, field);

	$: stringValue = value as Writable<number>;
</script>

<NumberInput
	{title}
	name={field}
	{numberDecimals}
	bind:value={$stringValue}
	errorMessage={$errors}
	tainted={$tainted}
	{highlightTainted}
	aria-invalid={$errors ? 'true' : undefined}
	class={$$props.class}
	{wrapperClass}
	on:blur
	on:keypress
	{...$constraints}
	{...$$restProps}
/>
