<script lang="ts" generics="T extends Record<string|number|symbol, unknown>">
	import BooleanFilterButtons from './filters/BooleanFilterButtons.svelte';

	import type { Writable } from 'svelte/store';

	import type { FormPathLeaves } from 'sveltekit-superforms';
	import { formFieldProxy, type SuperForm } from 'sveltekit-superforms';

	export let form: SuperForm<T, unknown>;
	export let field: FormPathLeaves<T>;
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
<input type="hidden" name={field} value={$booleanValue} />
