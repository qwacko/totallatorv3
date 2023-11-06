<script lang="ts">
	import ArrowRightIcon from '$lib/components/icons/ArrowRightIcon.svelte';
	import FilterMenuIcon from '$lib/components/icons/FilterMenuIcon.svelte';
	import FilterModifyIcon from '$lib/components/icons/FilterModifyIcon.svelte';
	import FilterReplaceIcon from '$lib/components/icons/FilterReplaceIcon.svelte';
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

<Button class="p-2" outline><FilterMenuIcon /></Button>
<Dropdown>
	{#each filterKeys as filterKey}
		{@const currentFilter = filters[filterKey]}
		{#if currentFilter.length === 1}
			{@const filter = currentFilter[0]}
			<DropdownItem href={filterToURL(filter)} class="flex flex-row gap-2">
				{#if filter.modificationType === 'modify'}<FilterModifyIcon />{:else}<FilterReplaceIcon
					/>{/if}{filter.group ? `${filter.group} : ` : ''}{filter.title}
			</DropdownItem>
		{:else}
			<DropdownItem class="flex items-center justify-between gap-2">
				{filterKey}<ArrowRightIcon />
			</DropdownItem>
			<Dropdown>
				{#each currentFilter as filter}
					<DropdownItem href={filterToURL(filter)} class="flex flex-row gap-2">
						{#if filter.modificationType === 'modify'}<FilterModifyIcon />{:else}<FilterReplaceIcon
							/>{/if}{filter.title}
					</DropdownItem>
				{/each}
			</Dropdown>
		{/if}
	{/each}
</Dropdown>
