<script lang="ts">
	import { Button } from 'flowbite-svelte';
	import IdFilter from './IDFilter.svelte';
	import FilterIdArray from './FilterIdArray.svelte';
	import type { SelectionType } from '../ComboSelectTypes';
	import TextInput from '../TextInput.svelte';
	import type { TagFilterSchemaType } from '$lib/schema/tagSchema';
	import { tagDropdownData } from '$lib/stores/dropdownStores.js';
	import type { TagDropdownType } from '$lib/server/db/actions/tagActions';

	let { filter = $bindable() }: { filter: TagFilterSchemaType | undefined } = $props();

	const idToString = (id: string) => {
		if ($tagDropdownData) {
			const matchingItem = $tagDropdownData.find((item) => item.id === id);
			if (matchingItem) {
				return matchingItem.title;
			}
		}
		return id;
	};

	const itemToOption = (data: TagDropdownType[number]): SelectionType => {
		if ($tagDropdownData) {
			const matchingItem = $tagDropdownData.find((item) => item.id === data.id);
			if (matchingItem) {
				return { label: matchingItem.title, value: matchingItem.id, disabled: false };
			}
		}
		return { label: data.id, value: data.id };
	};

	const itemToDisplay = (data: TagDropdownType[number]): { group?: string; title: string } => {
		if ($tagDropdownData) {
			const matchingItem = $tagDropdownData.find((item) => item.id === data.id);
			if (matchingItem) {
				return { group: matchingItem.group, title: matchingItem.title };
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
			title="Tag IDs"
			lookupItems={$tagDropdownData}
			{idToString}
			{itemToDisplay}
			{itemToOption}
		/>
		<TextInput bind:value={filter.title} name="title" title="Title" errorMessage="" />
		<TextInput bind:value={filter.group} name="group" title="Group Title" errorMessage="" />
		<TextInput bind:value={filter.single} name="single" title="Single Title" errorMessage="" />
	</div>
{/if}
