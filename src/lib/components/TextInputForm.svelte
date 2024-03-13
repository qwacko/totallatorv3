<script lang="ts" generics="T extends Record<string|number|symbol, unknown>">
	import { Button } from 'flowbite-svelte';

	import type { Writable } from 'svelte/store';

	import type { FormPathLeaves } from 'sveltekit-superforms';
	import { formFieldProxy, type SuperForm } from 'sveltekit-superforms';

	import TextInput from './TextInput.svelte';
	import CancelIcon from './icons/CancelIcon.svelte';

	export let form: SuperForm<T, unknown>;
	export let field: FormPathLeaves<T>;
	export let wrapperClass: string | undefined = undefined;
	export let outerWrapperClass: string | undefined = undefined;
	export let title: string | null;
	export let highlightTainted: boolean | undefined = true;
	export let clearable: boolean = false;
	export let clearField: FormPathLeaves<T> = field;

	const { value, errors, constraints, tainted } = formFieldProxy(form, field);
	const { value: clearValueOriginal } = formFieldProxy(form, clearField);

	$: stringValue = value as Writable<string>;
	$: clearValue = clearValueOriginal as Writable<boolean | undefined>;

	const updateStringValue = (newValue: string) => {
		if (clearable && newValue !== '' && $clearValue) {
			$clearValue = false;
		}
	};
	const updateClearValue = () => {
		if (clearable) {
			$clearValue = true;
			$stringValue = '';
		}
	};

	$: clearable && updateStringValue($stringValue);
</script>

<div class="flex w-full flex-row gap-2 {outerWrapperClass ? outerWrapperClass : ''}">
	<TextInput
		{title}
		name={field}
		bind:value={$stringValue}
		errorMessage={$errors}
		tainted={$tainted}
		{highlightTainted}
		aria-invalid={$errors ? 'true' : undefined}
		class={$$props.class}
		wrapperClass="flex-grow {wrapperClass}"
		on:blur
		on:keypress
		{...$constraints}
		{...$$restProps}
	/>
	{#if clearable}
		<Button class="flex self-end py-3" outline={$clearValue === false} on:click={updateClearValue}>
			<CancelIcon />
		</Button>
		{#if $clearValue}
			<input type="hidden" name={clearField} value="true" />
		{/if}
	{/if}
</div>
