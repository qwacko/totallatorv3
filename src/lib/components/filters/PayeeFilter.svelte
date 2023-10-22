<script lang="ts">
	import { Button } from 'flowbite-svelte';
	import IdFilter from './IDFilter.svelte';
	import FilterIdArray from './FilterIdArray.svelte';
	import type { SelectionType } from '../ComboSelectTypes';
	import TextInput from '../TextInput.svelte';

	type accountDetailType = {
		id: string;
		title: string;
		enabled: boolean;
		group?: string;
	};

	export let filter: { id?: string; idArray?: string[]; title?: string } | undefined;
	export let accountDetails: accountDetailType[] | undefined;

	const idToString = (id: string) => {
		if (accountDetails) {
			const matchingItem = accountDetails.find((item) => item.id === id);
			if (matchingItem) {
				return matchingItem.title;
			}
		}
		return id;
	};

	const itemToOption = (data: accountDetailType): SelectionType => {
		if (accountDetails) {
			const matchingItem = accountDetails.find((item) => item.id === data.id);
			if (matchingItem) {
				return { label: matchingItem.title, value: matchingItem.id, disabled: false };
			}
		}
		return { label: data.id, value: data.id };
	};

	const itemToDisplay = (data: accountDetailType): { group?: string; title: string } => {
		if (accountDetails) {
			const matchingItem = accountDetails.find((item) => item.id === data.id);
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
		<IdFilter bind:id={filter.id} {idToString} />
		<FilterIdArray
			bind:idArray={filter.idArray}
			title="Account IDs"
			lookupItems={accountDetails}
			{idToString}
			{itemToDisplay}
			{itemToOption}
		/>
		<TextInput bind:value={filter.title} name="title" title="Title" errorMessage="" />
	</div>
{/if}
