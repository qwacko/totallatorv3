<script lang="ts">
	import FilterIcon from '$lib/components/icons/FilterIcon.svelte';
	import type { JournalFilterSchemaType } from '$lib/schema/journalSchema';
	import type { ReusableFilterDropdownListType } from '$lib/server/db/actions/reusableFilterActions';
	import { Button, Dropdown, DropdownItem } from 'flowbite-svelte';

	export let filters: ReusableFilterDropdownListType;
	export let updateFilter: (filter: JournalFilterSchemaType) => string;
	export let newFilter: (filter: JournalFilterSchemaType) => string;

	$: filterKeys = Object.keys(filters);

	const filterToURL = (filter: ReusableFilterDropdownListType[string][number]) => {
		if (filter.modificationType === 'modify') {
			return updateFilter(filter.filter);
		}
		return newFilter(filter.filter);
	};
</script>

<Button><FilterIcon /></Button>
<Dropdown>
	{#each filterKeys as filterKey}
		{@const currentFilter = filters[filterKey]}
		{#if currentFilter.length === 1}
			{@const filter = currentFilter[0]}
			<DropdownItem href={filterToURL(filter)}>
				{filter.group ? `${filter.group} : ` : ''}{filter.title}
			</DropdownItem>
		{:else}
			<DropdownItem class="flex items-center justify-between">
				{filterKey}
			</DropdownItem>
			<Dropdown>
				{#each currentFilter as filter}
					<DropdownItem href={filterToURL(filter)}>
						{filter.title}
					</DropdownItem>
				{/each}
			</Dropdown>
		{/if}
	{/each}
</Dropdown>
