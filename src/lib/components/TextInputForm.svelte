<script lang="ts" context="module">
	import type { AnyZodObject } from 'zod';
	type T = AnyZodObject;
</script>

<script lang="ts" generics="T extends AnyZodObject">
	import type { Writable } from 'svelte/store';

	import type { z } from 'zod';
	import type { ZodValidation, FormPathLeaves } from 'sveltekit-superforms';
	import { formFieldProxy, type SuperForm } from 'sveltekit-superforms/client';

	import TextInput from './TextInput.svelte';

	export let form: SuperForm<ZodValidation<T>, unknown>;
	export let field: FormPathLeaves<z.infer<T>>;
	export let wrapperClass: string | undefined = undefined;
	export let title: string | null;

	const { value, errors, constraints } = formFieldProxy(form, field);

	$: stringValue = value as Writable<string>;
</script>

<TextInput
	{title}
	name={field}
	bind:value={$stringValue}
	errorMessage={$errors}
	aria-invalid={$errors ? 'true' : undefined}
	class={$$props.class}
	{wrapperClass}
	on:blur
	on:keypress
	{...$constraints}
	{...$$restProps}
/>
