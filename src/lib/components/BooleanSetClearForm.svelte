<script lang="ts" generics="T extends Record<string|number|symbol, unknown>">
	import { onMount } from 'svelte';

	import BooleanButtons from './BooleanButtons.svelte';

	import type { Writable } from 'svelte/store';

	import type { FormPathLeaves } from 'sveltekit-superforms';
	import { formFieldProxy, type SuperForm } from 'sveltekit-superforms';

	export let form: SuperForm<T, unknown>;
	export let setField: FormPathLeaves<T>;
	export let clearField: FormPathLeaves<T>;
	export let wrapperClass: string | undefined = undefined;
	export let title: string | null;

	export let onTitle: string = 'True';
	export let offTitle: string = 'False';
	export let clearTitle: string = 'Clear';
	export let hideClear: boolean = false;

	const { value: setValue } = formFieldProxy(form, setField);
	const { value: clearValue } = formFieldProxy(form, clearField);

	$: booleanSetValue = setValue as Writable<string | boolean | undefined>;
	$: booleanClearValue = clearValue as Writable<string | boolean | undefined>;

	onMount(() => {
		console.log('RUnning After Mout Function', {
			setValue: $booleanSetValue,
			clearValue: $booleanClearValue
		});
		if ($booleanSetValue === true || $booleanSetValue === 'true') {
			booleanValue = true;
		} else if ($booleanClearValue === 'true' || $booleanClearValue === true) {
			booleanValue = false;
		}
	});

	let booleanValue: boolean | undefined = undefined;

	const updateValue = (newValue: boolean | undefined) => {
		if (newValue === true) {
			$booleanSetValue = 'true';
			$booleanClearValue = undefined;
		} else if (newValue === false) {
			$booleanSetValue = undefined;
			$booleanClearValue = 'true';
		} else {
			$booleanSetValue = undefined;
			$booleanClearValue = undefined;
		}
		booleanValue = newValue;
	};
</script>

<div class="flex flex-col gap-2 {wrapperClass}">
	{#if title}
		<div class="flex text-sm font-semibold text-primary-900">
			{title}
		</div>
	{/if}
	<BooleanButtons
		value={booleanValue}
		{onTitle}
		{offTitle}
		{clearTitle}
		{hideClear}
		setNew={updateValue}
	/>

	{#if $booleanSetValue === 'true'}
		<input type="hidden" name={setField} value={$booleanSetValue} />
	{/if}
	{#if $booleanClearValue === 'true'}
		<input type="hidden" name={clearField} value={$booleanClearValue} />
	{/if}
</div>
