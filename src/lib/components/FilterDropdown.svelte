<script lang="ts">
	import ArrowRightIcon from '$lib/components/icons/ArrowRightIcon.svelte';
	import FilterMenuIcon from '$lib/components/icons/FilterMenuIcon.svelte';
	import FilterModifyIcon from '$lib/components/icons/FilterModifyIcon.svelte';
	import FilterReplaceIcon from '$lib/components/icons/FilterReplaceIcon.svelte';
	import { urlGenerator } from '$lib/routes';
	import {
		defaultAllJournalFilter,
		defaultJournalFilter,
		type JournalFilterSchemaType
	} from '$lib/schema/journalSchema';
	import type { ReusableFilterDropdownListType } from '$lib/server/db/actions/reusableFilterActions';
	import {
		Button,
		Dropdown,
		DropdownDivider,
		DropdownItem,
	} from 'flowbite-svelte';

	export let filters: ReusableFilterDropdownListType;
	export let updateFilter: (filter: JournalFilterSchemaType) => string;
	export let newFilter: (filter: JournalFilterSchemaType) => string;
	export let currentFilter: JournalFilterSchemaType;
	export let hideIcon = false;
	export let showDefaultJournalFilters = false;
	export let buttonText: string | undefined = undefined;
	export let hideButton: boolean = false;
	export let placement:   'top'
  | 'top-start'
  | 'top-end'
  | 'right'
  | 'right-start'
  | 'right-end'
  | 'bottom'
  | 'bottom-start'
  | 'bottom-end'
  | 'left'
  | 'left-start'
  | 'left-end' | undefined = undefined;

	$: filterKeys = Object.keys(filters).sort((a, b) => a.localeCompare(b));

	const filterToURL = (
		filter: Pick<ReusableFilterDropdownListType[string][number], 'filter' | 'modificationType'>
	) => {
		if (filter.modificationType === 'modify') {
			return updateFilter(filter.filter);
		}
		return newFilter(filter.filter);
	};
</script>

{#if !hideButton}
	<Button class="p-2" outline>
		{#if buttonText}{buttonText}{:else}<FilterMenuIcon />{/if}
	</Button>
{/if}
<Dropdown {placement}>
	{#if showDefaultJournalFilters}
		<DropdownItem
			href={filterToURL({
				filter: defaultAllJournalFilter(),
				modificationType: 'replace'
			})}
			class="flex flex-row gap-2"
		>
			All
		</DropdownItem>
		<DropdownItem
			href={filterToURL({ filter: defaultJournalFilter(), modificationType: 'replace' })}
			class="flex flex-row gap-2"
		>
			Assets / Liabilities
		</DropdownItem>
	{/if}
	{#each filterKeys as filterKey}
		{@const currentFilter = filters[filterKey].sort((a, b) => a.title.localeCompare(b.title))}
		{#if currentFilter.length === 1}
			{@const filter = currentFilter[0]}
			<DropdownItem href={filterToURL(filter)} class="flex flex-row gap-2">
				{#if !hideIcon}
					{#if filter.modificationType === 'modify'}
						<FilterModifyIcon />
					{:else}
						<FilterReplaceIcon />
					{/if}
				{/if}
				{filter.group ? `${filter.group} : ` : ''}{filter.title}
			</DropdownItem>
		{:else}
			<DropdownItem class="flex items-center justify-between gap-2">
				{filterKey}<ArrowRightIcon />
			</DropdownItem>
			<Dropdown>
				{#each currentFilter as filter}
					<DropdownItem href={filterToURL(filter)} class="flex flex-row gap-2">
						{#if !hideIcon}
							{#if filter.modificationType === 'modify'}
								<FilterModifyIcon />
							{:else}
								<FilterReplaceIcon />
							{/if}
						{/if}
						{filter.title}
					</DropdownItem>
				{/each}
			</Dropdown>
		{/if}
	{/each}
	{#if filterKeys.length > 0}
		<DropdownDivider />
	{/if}
	<DropdownItem
		href={urlGenerator({
			address: '/(loggedIn)/filters/create',
			searchParamsValue: { filter: currentFilter }
		}).url}
	>
		Create New Reusable Filter
	</DropdownItem>
</Dropdown>
