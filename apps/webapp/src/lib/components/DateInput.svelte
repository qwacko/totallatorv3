<script lang="ts">
	import { Button, Input, type InputProps, Label } from 'flowbite-svelte';
	import type { ChangeEventHandler } from 'svelte/elements';

	import ErrorText from './ErrorText.svelte';
	import CancelIcon from './icons/CancelIcon.svelte';

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
	}: Omit<InputProps<string>, 'name' | 'required' | 'value' | 'children'> & {
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
	} = $props();

	const usedValue = $derived(value ? value : '');
	const clearableVisible = $derived(clearable && value);

	const handleUpdate: ChangeEventHandler<HTMLInputElement> = (e) => {
		const { target } = e;
		const target2 = target ? (target as unknown as HTMLInputElement) : target;
		const newValue = target2?.value ? target2.value : null;
		value = newValue;
	};
</script>

<Label class="space-y-2 {flexGrow && 'flex grow basis-0 flex-col gap-0.5'}">
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
	>
		{#snippet right()}
			<Button
				size="sm"
				class="px-2 py-1 {clearableVisible ? '' : 'hidden'}"
				outline
				onclick={() => (value = null)}
			>
				<CancelIcon />
			</Button>
		{/snippet}
		<input type="date" value={usedValue} onchange={handleUpdate} />
	</Input>
	<ErrorText message={errorMessage} />
</Label>
