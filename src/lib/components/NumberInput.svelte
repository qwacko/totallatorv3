<script lang="ts">
	import { Input, Label } from 'flowbite-svelte';
	import ErrorText from './ErrorText.svelte';
	import type { ComponentProps } from 'svelte';

	type InputProps = ComponentProps<Input>;

	let {
		errorMessage,
		title,
		name,
		required,
		value = $bindable(),
		wrapperClass,
		tainted,
		highlightTainted,
		numberDecimals = 0,
		class: className = '',
		...restProps
	}: {
		errorMessage: string | string[] | null | undefined;
		title: string | null;
		name: string;
		required?: boolean | null;
		value: number | undefined;
		wrapperClass?: string;
		tainted?: boolean;
		highlightTainted?: boolean;
		numberDecimals?: 0 | 1 | 2;
		class?: string;
	} & Omit<InputProps, 'type' | 'value' | 'name' | 'required' | 'step'> = $props();
</script>

<div class="flex flex-col gap-2 {wrapperClass}">
	{#if title}
		<Label for={name} class="w-full space-y-2">
			<span class="flex flex-row gap-1">
				<div>
					{title}
				</div>
				<div>
					{#if required}
						*{/if}
				</div>
			</span>
		</Label>
	{/if}
	<Input
		type="number"
		bind:value
		step={numberDecimals === 0 ? 1 : numberDecimals === 1 ? 0.1 : numberDecimals === 2 ? 0.01 : 1}
		{...restProps}
		{name}
		{required}
		class="{className} {highlightTainted && tainted ? 'ring-2' : ''} "
		on:blur
		on:keypress
	/>
	<ErrorText message={errorMessage} />
</div>
