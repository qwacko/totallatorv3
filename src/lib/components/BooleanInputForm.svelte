<script lang="ts" context="module">
	import type { AnyZodObject } from 'zod';
</script>

<script lang="ts" generics="T extends AnyZodObject">
	import BooleanFilterButtons from './filters/BooleanFilterButtons.svelte';

	import type { Writable } from 'svelte/store';

	import type { z } from 'zod';
	import type { ZodValidation, FormPathLeaves } from 'sveltekit-superforms';
	import { formFieldProxy, type SuperForm } from 'sveltekit-superforms/client';

	export let form: SuperForm<ZodValidation<T>, unknown>;
	export let field: FormPathLeaves<z.infer<T>>;
	export let wrapperClass: string | undefined = undefined;
	export let title: string | null;

	export let onTitle: string = 'True';
	export let offTitle: string = 'False';
	export let clearTitle: string = 'Clear';
	export let hideClear: boolean = false;

	const { value } = formFieldProxy(form, field);

	$: booleanValue = value as Writable<boolean | undefined>;
</script>

<BooleanFilterButtons
	bind:value={$booleanValue}
	{title}
	{onTitle}
	{offTitle}
	{clearTitle}
	{hideClear}
	{wrapperClass}
/>
{#if value !== undefined}
	<input type="hidden" name={field} value={$value} />
{/if}
