<script lang="ts" context="module">
	import type { AnyZodObject } from 'zod';
</script>

<script lang="ts" generics="T extends AnyZodObject">
	import CurrencyInput from './CurrencyInput.svelte';

	import type { Writable } from 'svelte/store';

	import type { z } from 'zod';
	import type { ZodValidation, FormPathLeaves } from 'sveltekit-superforms';
	import { formFieldProxy, type SuperForm } from 'sveltekit-superforms/client';

	export let form: SuperForm<ZodValidation<T>, unknown>;
	export let field: FormPathLeaves<z.infer<T>>;
	export let wrapperClass: string | undefined = undefined;
	export let title: string | null;
	export let highlightTainted: boolean | undefined = true;

	const { value, errors, constraints, tainted } = formFieldProxy(form, field);

	$: stringValue = value as Writable<number>;
</script>

<CurrencyInput
	{title}
	name={field}
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
