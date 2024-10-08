<script lang="ts">
	import { Button } from 'flowbite-svelte';
	import IdFilter from './IDFilter.svelte';
	import FilterIdArray from './FilterIdArray.svelte';
	import type { SelectionType } from '../ComboSelectTypes';
	import TextInput from '../TextInput.svelte';
	import type { LabelFilterSchemaType } from '$lib/schema/labelSchema';
	import { labelDropdownData } from '$lib/stores/dropdownStores.js';
	import type { LabelDropdownType } from '$lib/server/db/actions/labelActions';

	let { filter = $bindable() }: { filter: LabelFilterSchemaType | undefined } = $props();

	const idToString = (id: string) => {
		if ($labelDropdownData) {
			const matchingItem = $labelDropdownData.find((item) => item.id === id);
			if (matchingItem) {
				return matchingItem.title;
			}
		}
		return id;
	};

	const itemToOption = (data: LabelDropdownType[number]): SelectionType => {
		if ($labelDropdownData) {
			const matchingItem = $labelDropdownData.find((item) => item.id === data.id);
			if (matchingItem) {
				return { label: matchingItem.title, value: matchingItem.id, disabled: false };
			}
		}
		return { label: data.id, value: data.id };
	};

	const itemToDisplay = (data: LabelDropdownType[number]): { group?: string; title: string } => {
		if ($labelDropdownData) {
			const matchingItem = $labelDropdownData.find((item) => item.id === data.id);
			if (matchingItem) {
				return { title: matchingItem.title };
			}
		}
		return { title: data.id };
	};
</script>

{#if filter === undefined}
	<Button on:click={() => (filter = {})}>Add Filter</Button>
{:else}
	<div class="flex flex-col gap-2">
		<Button on:click={() => (filter = undefined)}>Clear Filter</Button>
		<TextInput
			bind:value={filter.textFilter}
			title="Text Filter"
			name="textFilter"
			errorMessage=""
		/>
		<FilterIdArray bind:idArray={filter.importIdArray} title="Import Id" />
		<FilterIdArray bind:idArray={filter.importDetailIdArray} title="Import Detail Id" />
		<IdFilter bind:id={filter.id} {idToString} />
		<FilterIdArray
			bind:idArray={filter.idArray}
			title="Label IDs"
			lookupItems={$labelDropdownData}
			{idToString}
			{itemToDisplay}
			{itemToOption}
		/>
		<TextInput bind:value={filter.title} name="title" title="Title" errorMessage="" />
	</div>
{/if}
