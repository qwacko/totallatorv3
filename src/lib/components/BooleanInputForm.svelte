<script lang="ts" generics="T extends Record<string|number|symbol, unknown>">
	import BooleanFilterButtons from './filters/BooleanFilterButtons.svelte';

	import type { Writable } from 'svelte/store';

	import type { FormPathLeaves } from 'sveltekit-superforms';
	import { formFieldProxy, type SuperForm } from 'sveltekit-superforms';

	const {
		form,
		field,
		wrapperClass = undefined,
		title,
		onTitle = 'True',
		offTitle = 'False',
		clearTitle = 'Clear',
		hideClear = false,
		disabled = false
	}: {
		form: SuperForm<T, unknown>;
		field: FormPathLeaves<T>;
		wrapperClass?: string;
		title: string | null;
		onTitle?: string;
		offTitle?: string;
		clearTitle?: string;
		hideClear?: boolean;
		disabled?: boolean;
	} = $props();

	const { value } = formFieldProxy(form, field);

	const booleanValue = value as Writable<boolean | undefined>;
</script>

<BooleanFilterButtons
	bind:value={$booleanValue}
	{title}
	{onTitle}
	{offTitle}
	{clearTitle}
	{hideClear}
	{wrapperClass}
	{disabled}
/>
<input type="hidden" name={field} value={$booleanValue} />
