<script lang="ts">
	import { Label, Input, Button } from 'flowbite-svelte';
	import ErrorText from './ErrorText.svelte';
	import type { ChangeEventHandler } from 'svelte/elements';
	import CancelIcon from './icons/CancelIcon.svelte';
	import type { ComponentProps } from 'svelte';

	type InputProps = ComponentProps<Input>;

	let {
		errorMessage,
		title,
		name,
		required,
		value = $bindable(),
		clearable = true,
		tainted,
		highlightTainted,
		flexGrow = false,
		class: className = '',
		...restProps
	}: {
		errorMessage: string | string[] | null | undefined;
		title: string | null;
		name: string;
		required?: boolean | null;
		value: string | null | undefined;
		clearable?: boolean;
		tainted?: boolean;
		highlightTainted?: boolean;
		flexGrow?: boolean;
		class?: string;
	} & Omit<InputProps, 'name' | 'required'> = $props();

	const usedValue = $derived(value ? value : '');
	const clearableVisible = $derived(clearable && value);

	const handleUpdate: ChangeEventHandler<HTMLInputElement> = (e) => {
		const { target } = e;
		const target2 = target ? (target as unknown as HTMLInputElement) : target;
		const newValue = target2?.value ? target2.value : null;
		value = newValue;
	};
</script>

<Label class="space-y-2 {flexGrow && 'flex flex-grow basis-0 flex-col gap-0.5'}">
	{#if title}
		<span class="flex flex-row gap-1">
			<div>
				{title}
			</div>
			<div>
				{#if required}
					*
				{/if}
			</div>
		</span>
	{/if}
	<Input
		{...restProps}
		{name}
		{required}
		class="{className} {highlightTainted && tainted ? 'ring-2' : ''} "
		let:props
	>
		<Button
			slot="right"
			color="none"
			size="sm"
			class="px-2 py-1 {clearableVisible ? '' : 'hidden'}"
			outline
			on:click={() => (value = null)}
		>
			<CancelIcon />
		</Button>
		<input type="date" value={usedValue} onchange={handleUpdate} {...props} />
	</Input>
	<ErrorText message={errorMessage} />
</Label>
