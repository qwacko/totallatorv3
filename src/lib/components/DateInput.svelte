<script lang="ts">
	import { Label, Input, Button } from 'flowbite-svelte';
	import ErrorText from './ErrorText.svelte';
	import type { ChangeEventHandler } from 'svelte/elements';
	import CancelIcon from './icons/CancelIcon.svelte';

	export let errorMessage: string | string[] | null | undefined;
	export let title: string | null;
	export let name: string;
	export let required: boolean | undefined | null = undefined;
	export let value: string | null | undefined;
	export let clearable = true;

	$: usedValue = value ? value : '';
	$: clearableVisible = clearable && value;

	const handleUpdate: ChangeEventHandler<HTMLInputElement> = (e) => {
		const { target } = e;
		const target2 = target ? (target as unknown as HTMLInputElement) : target;
		const newValue = target2?.value ? target2.value : null;
		value = newValue;
	};
</script>

<Label class="space-y-2">
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
	<Input {...$$restProps} {name} {required} let:props>
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
		<input type="date" value={usedValue} on:change={handleUpdate} {...props} />
	</Input>
	<ErrorText message={errorMessage} />
</Label>
