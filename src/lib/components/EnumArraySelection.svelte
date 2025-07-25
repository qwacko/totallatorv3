<script lang="ts" generics="T extends string">
	import { Button, ButtonGroup } from 'flowbite-svelte';

	let {
		values = $bindable(undefined),
		enumSelection,
		onUpdate,
		clearable = true,
	}: {
		values: T[] | undefined;
		enumSelection: { value: T; name: string }[];
		onUpdate?: (newValues: T[] | undefined) => void;
		clearable?: boolean;
	} = $props();

	const toggleArray = (itemValue: T) => {
		if (values && values.length > 0) {
			if (values.includes(itemValue)) {
				const newValues = values.filter((item) => item !== itemValue);
				if (newValues.length > 0) {
					return newValues;
				}
				return [];
			}
			return [...values, itemValue];
		}
		return [itemValue];
	};

	const handleToggle = (itemValue: T) => {
		const newValues = toggleArray(itemValue);
		const result = newValues.length > 0 ? newValues : undefined;
		values = result;
		if (onUpdate) {
			onUpdate(result);
		}
	};

	const handleClear = () => {
		values = undefined;
		if (onUpdate) {
			onUpdate(undefined);
		}
	};
</script>

<ButtonGroup>
	{#each enumSelection as currentItem}
		{@const isSelected = values?.includes(currentItem.value)}
		<Button
			color="primary"
			outline={!isSelected}
			class="grow basis-0"
			on:click={() => handleToggle(currentItem.value)}
		>
			{currentItem.name}
		</Button>
	{/each}
	{#if clearable}
		<Button on:click={handleClear} color="primary" class="grow basis-0">Clear</Button>
	{/if}
</ButtonGroup>
