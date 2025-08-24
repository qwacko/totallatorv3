<script lang="ts" generics="T extends Record<string|number|symbol, unknown>">
	import { onMount } from 'svelte';
	import type { Writable } from 'svelte/store';
	import type { FormPathLeaves } from 'sveltekit-superforms';
	import { formFieldProxy, type SuperForm } from 'sveltekit-superforms';

	import BooleanButtons from './BooleanButtons.svelte';

	const {
		form,
		setField,
		clearField,
		wrapperClass = undefined,
		title,
		onTitle = 'True',
		offTitle = 'False',
		clearTitle = 'Clear',
		hideClear = false
	}: {
		form: SuperForm<T, unknown>;
		setField: FormPathLeaves<T>;
		clearField: FormPathLeaves<T>;
		wrapperClass?: string;
		title: string | null;
		onTitle?: string;
		offTitle?: string;
		clearTitle?: string;
		hideClear?: boolean;
	} = $props();

	const { value: setValue } = formFieldProxy(form, setField);
	const { value: clearValue } = formFieldProxy(form, clearField);

	const booleanSetValue = $derived(setValue as Writable<string | boolean | undefined>);
	const booleanClearValue = $derived(clearValue as Writable<string | boolean | undefined>);

	onMount(() => {
		if ($booleanSetValue === true || $booleanSetValue === 'true') {
			booleanValue = true;
		} else if ($booleanClearValue === 'true' || $booleanClearValue === true) {
			booleanValue = false;
		}
	});

	let booleanValue = $state<boolean | undefined>(undefined);

	$effect(() => {
		if ($booleanSetValue == true && !booleanValue) {
			booleanValue = true;
		} else if ($booleanSetValue == false && booleanValue) {
			booleanValue = false;
		}
	});

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
		<div class="text-primary-900 flex text-sm font-semibold">
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

	{#if $booleanSetValue === 'true' || $booleanSetValue === true}
		<input type="hidden" name={setField} value={true} />
	{/if}
	{#if $booleanClearValue === 'true' || $booleanClearValue === true}
		<input type="hidden" name={clearField} value={true} />
	{/if}
</div>
