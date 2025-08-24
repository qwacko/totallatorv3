<script lang="ts" module>
	import type { DisplayFunction, IDRecord, OptionFunction } from './../ComboSelectTypes';
</script>

<script lang="ts" generics="T extends IDRecord">
	import { Button } from 'flowbite-svelte';

	import ComboSelect from '../ComboSelect.svelte';

	let {
		idArray = $bindable(),
		title,
		lookupItems,
		idToString,
		itemToOption,
		itemToDisplay
	}: {
		idArray: string[] | undefined;
		title: string;
		lookupItems?: T[];
		idToString?: (id: string) => string;
		itemToOption?: OptionFunction<T>;
		itemToDisplay?: DisplayFunction<T>;
	} = $props();

	let comboId = $state('');
</script>

{#if (idArray && idArray.length > 0) || (lookupItems && lookupItems.length > 0)}
	<div class="flex text-sm font-semibold text-black">{title}</div>
	{#if idArray}
		<div class="flex flex-row flex-wrap gap-2">
			{#each idArray as currentId}
				<Button
					class="whitespace-nowrap"
					size="xs"
					color="light"
					onclick={() => idArray && (idArray = idArray.filter((item) => item !== currentId))}
				>
					{idToString ? idToString(currentId) : currentId}
				</Button>
			{/each}
		</div>
	{/if}
	{#if lookupItems && lookupItems.length > 0 && itemToOption && itemToDisplay}
		<div class="flex flex-row gap-2">
			<ComboSelect
				items={lookupItems}
				bind:value={comboId}
				title=""
				{itemToOption}
				{itemToDisplay}
				class="flex grow"
			/>
			<Button
				onclick={() => {
					if (idArray) {
						idArray = [...idArray, comboId];
					} else {
						idArray = [comboId];
					}
				}}
			>
				+
			</Button>
		</div>
	{/if}
{/if}
