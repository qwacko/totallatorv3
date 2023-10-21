<script lang="ts" context="module">
	import type { IDRecord, OptionFunction, DisplayFunction } from './../ComboSelectTypes';
</script>

<script lang="ts" generics="T extends IDRecord">
	import { Button } from 'flowbite-svelte';
	import ComboSelect from '../ComboSelect.svelte';

	export let idArray: string[] | undefined;
	export let title: string;
	export let lookupItems: T[] | undefined = undefined;
	export let idToString: ((id: string) => string) | undefined = undefined;
	export let itemToOption: OptionFunction<T> | undefined = undefined;
	export let itemToDisplay: DisplayFunction<T> | undefined = undefined;

	let comboId = '';
</script>

{#if (idArray && idArray.length > 0) || (lookupItems && lookupItems.length > 0)}
	<div class="flex font-semibold text-black text-sm">{title}</div>
	{#if idArray}
		<div class="flex flex-row gap-2 flex-wrap">
			{#each idArray as currentId}
				<Button
					class="whitespace-nowrap"
					size="xs"
					color="light"
					on:click={() => idArray && (idArray = idArray.filter((item) => item !== currentId))}
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
				class="flex flex-grow"
			/>
			<Button
				on:click={() => {
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
