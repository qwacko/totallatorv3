<script lang="ts" generics="T extends string">
	import { Button, ButtonGroup } from 'flowbite-svelte';

	let {
		value = $bindable(undefined),
		enumSelection,
		onUpdate,
		clearable = true,
	}: {
		value: T | undefined;
		enumSelection: { value: T; name: string }[];
		onUpdate?: (newValue: T | undefined) => void;
		clearable?: boolean;
	} = $props();

	const handleSelect = (itemValue: T) => {
		// If already selected, deselect (only if clearable)
		if (value === itemValue && clearable) {
			value = undefined;
		} else {
			value = itemValue;
		}
		
		if (onUpdate) {
			onUpdate(value);
		}
	};

	const handleClear = () => {
		value = undefined;
		if (onUpdate) {
			onUpdate(undefined);
		}
	};
</script>

<ButtonGroup>
	{#each enumSelection as currentItem}
		{@const isSelected = value === currentItem.value}
		<Button
			color="primary"
			outline={!isSelected}
			class="grow basis-0"
			on:click={() => handleSelect(currentItem.value)}
		>
			{currentItem.name}
		</Button>
	{/each}
	{#if clearable}
		<Button on:click={handleClear} color="primary" class="grow basis-0">Clear</Button>
	{/if}
</ButtonGroup>