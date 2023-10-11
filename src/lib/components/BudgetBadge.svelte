<script lang="ts">
	import { Badge, Button, Dropdown } from 'flowbite-svelte';
	import type { JournalSummaryPropType } from './helpers/JournalSummaryPropType';
	import JournalSummary from './JournalSummary.svelte';
	import FilterIcon from './icons/FilterIcon.svelte';
	import { urlGenerator } from '$lib/routes';
	import { defaultJournalFilter } from '$lib/schema/journalSchema';
	import BudgetIcon from './icons/BudgetIcon.svelte';
	import { goto } from '$app/navigation';

	export let data: { budgetId: string | null; budgetTitle: string | null };

	export let summaryData: JournalSummaryPropType | undefined = undefined;
	export let filterURL: string | undefined = undefined;

	let opened = false;
</script>

{#if data.budgetTitle && data.budgetId}
	<Badge class="gap-2" on:click={() => (opened = true)}>
		<BudgetIcon />
		{data.budgetTitle}
	</Badge>
	<Dropdown bind:open={opened} class="p-2 w-52" border>
		<div class="flex flex-col gap-1">
			{#if data.budgetTitle}
				<div class="flex">
					{data.budgetTitle}
				</div>
			{/if}
			<div class="flex flex-row">
				{#if summaryData}
					<JournalSummary
						id={data.budgetId || 'dummy'}
						items={summaryData}
						format="USD"
						summaryTitle="{data.budgetTitle || ''} Summary"
						summaryFilter={{ budget: { id: data.budgetId } }}
					/>
				{/if}
				<div class="flex flex-grow" />
				{#if filterURL}
					<Button href={filterURL} outline color="light" size="xs"><FilterIcon /></Button>
				{/if}
			</div>
		</div>
	</Dropdown>
{/if}
