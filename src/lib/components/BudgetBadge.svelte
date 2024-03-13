<script lang="ts">
	import { Badge, Button, Dropdown } from 'flowbite-svelte';
	import FilterIcon from './icons/FilterIcon.svelte';
	import { urlGenerator } from '$lib/routes';
	import { defaultJournalFilter, type JournalFilterSchemaType } from '$lib/schema/journalSchema';
	import BudgetIcon from './icons/BudgetIcon.svelte';
	import JournalEntryIcon from './icons/JournalEntryIcon.svelte';

	export let data: { budgetId: string | null; budgetTitle: string | null };
	export let currentFilter: JournalFilterSchemaType;

	let opened = false;

	$: filterURL = urlGenerator({
		address: '/(loggedIn)/journals',
		searchParamsValue: {
			...currentFilter,
			budget: {
				id: data.budgetId || undefined
			}
		}
	}).url;

	$: viewURL = urlGenerator({
		address: '/(loggedIn)/journals',
		searchParamsValue: {
			...defaultJournalFilter(),
			budget: {
				id: data.budgetId || undefined
			}
		}
	}).url;
</script>

{#if data.budgetTitle && data.budgetId}
	<Badge class="gap-2" on:click={() => (opened = true)}>
		<BudgetIcon />
		{data.budgetTitle}
	</Badge>
	<Dropdown bind:open={opened} class="w-52 p-2" border>
		<div class="flex flex-col gap-1">
			{#if data.budgetTitle}
				<div class="flex">
					{data.budgetTitle}
				</div>
			{/if}
			<div class="flex flex-row justify-between">
				<Button href={viewURL} outline color="light" size="xs"><JournalEntryIcon /></Button>
				<Button href={filterURL} outline color="light" size="xs"><FilterIcon /></Button>
			</div>
		</div>
	</Dropdown>
{/if}
