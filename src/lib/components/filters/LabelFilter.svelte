<script lang="ts">
	import { Button } from 'flowbite-svelte';
	import IdFilter from './IDFilter.svelte';
	import FilterIdArray from './FilterIdArray.svelte';
	import type { SelectionType } from '../ComboSelectTypes';
	import TextInput from '../TextInput.svelte';
	import type { LabelFilterSchemaType } from '$lib/schema/labelSchema';

	type labelDetailType = {
		id: string;
		title: string;
		enabled: boolean;
		group?: string;
	};

	export let filter: LabelFilterSchemaType | undefined;
	export let labelDetails: labelDetailType[] | undefined;

	const idToString = (id: string) => {
		if (labelDetails) {
			const matchingItem = labelDetails.find((item) => item.id === id);
			if (matchingItem) {
				return matchingItem.title;
			}
		}
		return id;
	};

	const itemToOption = (data: labelDetailType): SelectionType => {
		if (labelDetails) {
			const matchingItem = labelDetails.find((item) => item.id === data.id);
			if (matchingItem) {
				return { label: matchingItem.title, value: matchingItem.id, disabled: false };
			}
		}
		return { label: data.id, value: data.id };
	};

	const itemToDisplay = (data: labelDetailType): { group?: string; title: string } => {
		if (labelDetails) {
			const matchingItem = labelDetails.find((item) => item.id === data.id);
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
		<FilterIdArray bind:idArray={filter.importIdArray} title="Import Id" />
		<FilterIdArray bind:idArray={filter.importDetailIdArray} title="Import Detail Id" />
		<IdFilter bind:id={filter.id} {idToString} />
		<FilterIdArray
			bind:idArray={filter.idArray}
			title="Label IDs"
			lookupItems={labelDetails}
			{idToString}
			{itemToDisplay}
			{itemToOption}
		/>
		<TextInput bind:value={filter.title} name="title" title="Title" errorMessage="" />
	</div>
{/if}
