<script lang="ts">
	import type { AccountFilterSchemaType } from '$lib/schema/accountSchema';
	import { Button } from 'flowbite-svelte';
	import IdFilter from './IDFilter.svelte';
	import FilterIdArray from './FilterIdArray.svelte';
	import type { SelectionType } from '../ComboSelectTypes';
	import TextInput from '../TextInput.svelte';
	import AccountTypeFilter from './AccountTypeFilter.svelte';
	import BooleanFilterButtons from './BooleanFilterButtons.svelte';
	import DateInput from '../DateInput.svelte';
	import { accountDropdownData } from '$lib/stores/dropdownStores.js';
	import type { AccountDropdownType } from '$lib/server/db/actions/accountActions';

	let { filter = $bindable() }: { filter: AccountFilterSchemaType | undefined } = $props();

	const idToString = (id: string) => {
		if ($accountDropdownData) {
			const matchingItem = $accountDropdownData.find((item) => item.id === id);
			if (matchingItem) {
				return matchingItem.title;
			}
		}
		return id;
	};

	const itemToOption = (data: AccountDropdownType[number]): SelectionType => {
		if ($accountDropdownData) {
			const matchingItem = $accountDropdownData.find((item) => item.id === data.id);
			if (matchingItem) {
				return { label: matchingItem.title, value: matchingItem.id, disabled: false };
			}
		}
		return { label: data.id, value: data.id };
	};

	const itemToDisplay = (data: AccountDropdownType[number]): { group?: string; title: string } => {
		if ($accountDropdownData) {
			const matchingItem = $accountDropdownData.find((item) => item.id === data.id);
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
			name="textFilter"
			title="Text Filter"
			errorMessage=""
		/>
		<FilterIdArray bind:idArray={filter.importIdArray} title="Import Id" />
		<FilterIdArray bind:idArray={filter.importDetailIdArray} title="Import Detail Id" />
		<IdFilter bind:id={filter.id} {idToString} />
		<FilterIdArray
			bind:idArray={filter.idArray}
			title="Account IDs"
			lookupItems={$accountDropdownData}
			{idToString}
			{itemToDisplay}
			{itemToOption}
		/>
		<TextInput bind:value={filter.title} name="title" title="Title" errorMessage="" />
		<TextInput
			bind:value={filter.accountGroup}
			name="accountGroup"
			title="Account Group"
			errorMessage=""
		/>
		<TextInput
			bind:value={filter.accountGroup2}
			name="accountGroup2"
			title="Account Group 2"
			errorMessage=""
		/>
		<TextInput
			bind:value={filter.accountGroup3}
			name="accountGroup3"
			title="Account Group 3"
			errorMessage=""
		/>
		<TextInput
			bind:value={filter.accountGroupCombined}
			name="accountGroupCombined"
			title="Account Group Combined"
			errorMessage=""
		/>
		<TextInput
			bind:value={filter.accountTitleCombined}
			name="accountTitleCombined"
			title="Account Title Combined"
			errorMessage=""
		/>
		<AccountTypeFilter bind:accountTypes={filter.type} />
		<BooleanFilterButtons
			bind:value={filter.isNetWorth}
			title="Net Worth"
			onTitle="Net Worth"
			offTitle="Not Net Worth"
		/>
		<BooleanFilterButtons
			bind:value={filter.isCash}
			title="Cash"
			onTitle="Cash"
			offTitle="Not Cash"
		/>
		<div class="flex text-sm font-semibold text-primary-900">Account Start Date</div>
		<div class="flex flex-row gap-1">
			<DateInput
				bind:value={filter.startDateAfter}
				title="After"
				errorMessage=""
				name="startDateAfter"
				flexGrow
			/>
			<DateInput
				bind:value={filter.startDateBefore}
				title="Before"
				errorMessage=""
				name="startDateBefore"
				class="flex flex-grow basis-0"
				flexGrow
			/>
		</div>
		<div class="flex text-sm font-semibold text-primary-900">Account End Date</div>
		<div class="flex flex-row gap-1">
			<DateInput
				bind:value={filter.endDateAfter}
				title="After"
				errorMessage=""
				name="endDateAfter"
				flexGrow
			/>
			<DateInput
				bind:value={filter.endDateBefore}
				title="Before"
				errorMessage=""
				name="endDateBefore"
				class="flex flex-grow basis-0"
				flexGrow
			/>
		</div>
	</div>
{/if}
