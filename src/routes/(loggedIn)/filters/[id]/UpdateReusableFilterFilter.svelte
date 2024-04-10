<script lang="ts">
	import FilterModal from '$lib/components/FilterModal.svelte';
	import JournalEntryIcon from '$lib/components/icons/JournalEntryIcon.svelte';
	import { urlGenerator } from '$lib/routes.js';
	import { type JournalFilterSchemaType } from '$lib/schema/journalSchema.js';
	import { Button, P } from 'flowbite-svelte';
	import PreviousUrlInput from '$lib/components/PreviousURLInput.svelte';
	import { defaultJournalFilter } from '$lib/schema/journalSchema';
	import { enhance } from '$app/forms';
	import { customEnhance } from '$lib/helpers/customEnhance';

	export let filter: JournalFilterSchemaType | undefined;
	export let filterModal: boolean = false;
	export let id: string;
	export let numberResults: number;
	export let filterText: string[] | undefined;
	type DDI = { id: string; title: string; group: string; enabled: boolean };
	type DDINoGroup = { id: string; title: string; enabled: boolean };
	export let dropdownInfo: {
		tag: Promise<DDI[]>;
		bill: Promise<DDINoGroup[]>;
		budget: Promise<DDINoGroup[]>;
		category: Promise<DDI[]>;
		account: Promise<DDI[]>;
		label: Promise<DDINoGroup[]>;
	};
</script>

<input type="hidden" name="id" value={id} />
<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
	<div class="flex flex-col gap-2">
		<P class="self-center" weight="semibold">Filter</P>
		<div class="flex flex-row items-center gap-6 self-center">
			<div class="flex flex-col gap-1">
				<FilterModal
					currentFilter={filter || defaultJournalFilter()}
					accountDropdown={dropdownInfo.account}
					billDropdown={dropdownInfo.bill}
					categoryDropdown={dropdownInfo.category}
					budgetDropdown={dropdownInfo.budget}
					tagDropdown={dropdownInfo.tag}
					labelDropdown={dropdownInfo.label}
					bind:opened={filterModal}
				>
					<svelte:fragment slot="footerContents" let:activeFilter>
						<Button on:click={() => (filterModal = false)} outline>Cancel</Button>
						<div class="flex-grow"></div>

						<form
							method="post"
							action="?/updateFilter"
							use:enhance={customEnhance({
								onSuccess: () => {
									filterModal = false;
								}
							})}
						>
							<input type="hidden" name="filter" value={JSON.stringify(activeFilter)} />
							<PreviousUrlInput name="prevPage" routeBased />
							<Button type="submit">Apply</Button>
						</form>
					</svelte:fragment>
				</FilterModal>
				<Button
					href={urlGenerator({
						address: '/(loggedIn)/journals',
						searchParamsValue: filter || defaultJournalFilter()
					}).url}
					color="blue"
					outline
					size="sm"
				>
					<JournalEntryIcon />
				</Button>
			</div>
			<div class="flex flex-col gap-1">
				{#if filterText}
					{#each filterText as currentFilterText}
						<div class="flex">{currentFilterText}</div>
					{/each}
				{/if}
				<div class="flex text-gray-400">{numberResults} matching journals</div>
			</div>
		</div>
	</div>
</div>
