<script lang="ts">
	import { Label, Checkbox } from 'flowbite-svelte';
	import ErrorText from './ErrorText.svelte';
	import type { ComponentProps } from 'svelte';

	type CheckboxProps = ComponentProps<Checkbox>;

	let {
		errorMessage,
		title = undefined,
		displayText = undefined,
		name,
		required = undefined,
		value = $bindable(),
		...restProps
	}: {
		errorMessage: string | string[] | null | undefined;
		title?: string | null | undefined;
		displayText?: string | null | undefined;
		name: string;
		required?: boolean | undefined | null;
		value: boolean | undefined;
	} & Omit<CheckboxProps, 'checked' | 'name' | 'required'> = $props();
</script>

<Label class="space-y-2">
	{#if title}
		<span class="flex flex-row gap-1">
			<div>
				{title}
			</div>
			<div>
				{#if required}
					*{/if}
			</div>
		</span>
	{/if}
	<Checkbox
		checked={value}
		{...restProps}
		{name}
		required={required || undefined}
		on:change={() => (value = !value)}
	>
		{displayText ? displayText : ''}
	</Checkbox>
	<ErrorText message={errorMessage} />
</Label>
