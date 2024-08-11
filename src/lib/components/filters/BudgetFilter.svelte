<script lang="ts">
	import { Button } from 'flowbite-svelte';
	import IdFilter from './IDFilter.svelte';
	import FilterIdArray from './FilterIdArray.svelte';
	import type { SelectionType } from '../ComboSelectTypes';
	import TextInput from '../TextInput.svelte';
	import type { BudgetFilterSchemaType } from '$lib/schema/budgetSchema';
	import { budgetDropdownData } from '$lib/stores/dropdownStores.svelte.js';
	import type { BudgetDropdownType } from '$lib/server/db/actions/budgetActions';

	let { filter = $bindable() }: { filter: BudgetFilterSchemaType | undefined } = $props();

	const idToString = (id: string) => {
		if (budgetDropdownData.value) {
			const matchingItem = budgetDropdownData.value.find((item) => item.id === id);
			if (matchingItem) {
				return matchingItem.title;
			}
		}
		return id;
	};

	const itemToOption = (data: BudgetDropdownType[number]): SelectionType => {
		if (budgetDropdownData.value) {
			const matchingItem = budgetDropdownData.value.find((item) => item.id === data.id);
			if (matchingItem) {
				return { label: matchingItem.title, value: matchingItem.id, disabled: false };
			}
		}
		return { label: data.id, value: data.id };
	};

	const itemToDisplay = (data: BudgetDropdownType[number]): { group?: string; title: string } => {
		if (budgetDropdownData.value) {
			const matchingItem = budgetDropdownData.value.find((item) => item.id === data.id);
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
			title="Budget IDs"
			lookupItems={budgetDropdownData.value}
			{idToString}
			{itemToDisplay}
			{itemToOption}
		/>
		<TextInput bind:value={filter.title} name="title" title="Title" errorMessage="" />
	</div>
{/if}
