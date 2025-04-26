<script lang="ts" generics="T extends Record<string|number|symbol, unknown>">
	// import BooleanFilterButtons from './filters/BooleanFilterButtons.svelte';

	import type { Writable } from 'svelte/store';

	import type { FormPathLeaves } from 'sveltekit-superforms';
	import { formFieldProxy, type SuperForm } from 'sveltekit-superforms';
	import CheckboxInput from './CheckboxInput.svelte';

	const {
		form,
		field,
		title,
		displayText,
		disabled = false
	}: {
		form: SuperForm<T, unknown>;
		field: FormPathLeaves<T>;
		title?: string;
		displayText?: string;

		disabled?: boolean;
	} = $props();

	const { value } = formFieldProxy(form, field);

	const booleanValue = $derived(value as Writable<boolean | undefined>);
</script>

<CheckboxInput
	{title}
	{displayText}
	bind:value={$booleanValue}
	name="Name"
	errorMessage=""
	{disabled}
/>

<input type="hidden" name={field} value={$booleanValue} />
