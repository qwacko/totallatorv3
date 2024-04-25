<script
	lang="ts"
	generics="F extends JournalFilterSchemaType | JournalFilterSchemaWithoutPaginationType"
>
	import type {
		JournalFilterSchemaType,
		JournalFilterSchemaWithoutPaginationType
	} from '$lib/schema/journalSchema';
	import { Button, Accordion, AccordionItem, Input } from 'flowbite-svelte';
	import JournalEntryFilter from './filters/JournalEntryFilter.svelte';
	import AccountFilter from './filters/AccountFilter.svelte';
	import BillFilter from './filters/BillFilter.svelte';
	import BudgetFilter from './filters/BudgetFilter.svelte';
	import CategoryFilter from './filters/CategoryFilter.svelte';
	import TagFilter from './filters/TagFilter.svelte';
	import LabelFilter from './filters/LabelFilter.svelte';
	import PayeeFilter from './filters/PayeeFilter.svelte';

	export let currentFilter: F;
	export let urlFromFilter: ((filter: F) => string) | undefined = undefined;
	export let hideSubmit = false;
	export let url = '';
	export let activeFilter: F = currentFilter;
	export let hideDates = false;

	$: activeFilter = currentFilter;
	$: url = urlFromFilter ? urlFromFilter(activeFilter) : '';
</script>

<div class="flex flex-col gap-6">
	<Input
		bind:value={activeFilter.textFilter}
		name="textFilter"
		title="Text Filter"
		errorMessage=""
	/>
	<Accordion>
		<AccordionItem>
			<svelte:fragment slot="header">Journal Entry</svelte:fragment>
			<JournalEntryFilter bind:activeFilter {hideDates} />
		</AccordionItem>
		<AccordionItem>
			<svelte:fragment slot="header">Account</svelte:fragment>
			<AccountFilter bind:filter={activeFilter.account} />
		</AccordionItem>
		<AccordionItem>
			<svelte:fragment slot="header">Exclude Account</svelte:fragment>
			<AccountFilter bind:filter={activeFilter.excludeAccount} />
		</AccordionItem>
		<AccordionItem>
			<svelte:fragment slot="header">Payee</svelte:fragment>
			<PayeeFilter bind:filter={activeFilter.payee} />
		</AccordionItem>
		<AccordionItem>
			<svelte:fragment slot="header">Exclude Payee</svelte:fragment>
			<PayeeFilter bind:filter={activeFilter.excludePayee} />
		</AccordionItem>
		<AccordionItem>
			<svelte:fragment slot="header">Bill</svelte:fragment>
			<BillFilter bind:filter={activeFilter.bill} />
		</AccordionItem>
		<AccordionItem>
			<svelte:fragment slot="header">Exclude Bill</svelte:fragment>
			<BillFilter bind:filter={activeFilter.excludeBill} />
		</AccordionItem><AccordionItem>
			<svelte:fragment slot="header">Exclude Budget</svelte:fragment>
			<BudgetFilter bind:filter={activeFilter.excludeBudget} />
		</AccordionItem>
		<AccordionItem>
			<svelte:fragment slot="header">Budget</svelte:fragment>
			<BudgetFilter bind:filter={activeFilter.budget} />
		</AccordionItem>
		<AccordionItem>
			<svelte:fragment slot="header">Category</svelte:fragment>
			<CategoryFilter bind:filter={activeFilter.category} />
		</AccordionItem>
		<AccordionItem>
			<svelte:fragment slot="header">Exclude Category</svelte:fragment>
			<CategoryFilter bind:filter={activeFilter.excludeCategory} />
		</AccordionItem>
		<AccordionItem>
			<svelte:fragment slot="header">Tag</svelte:fragment>
			<TagFilter bind:filter={activeFilter.tag} />
		</AccordionItem>
		<AccordionItem>
			<svelte:fragment slot="header">Exclude Tag</svelte:fragment>
			<TagFilter bind:filter={activeFilter.excludeTag} />
		</AccordionItem>
		<AccordionItem>
			<svelte:fragment slot="header">Label</svelte:fragment>
			<LabelFilter bind:filter={activeFilter.label} />
		</AccordionItem>
		<AccordionItem>
			<svelte:fragment slot="header">Exclude Label</svelte:fragment>
			<LabelFilter bind:filter={activeFilter.excludeLabel} />
		</AccordionItem>
		<AccordionItem>
			<svelte:fragment slot="header">Current Filter Raw</svelte:fragment>
			<pre>{JSON.stringify(activeFilter, null, 2)}</pre>
		</AccordionItem>
	</Accordion>
	{#if !hideSubmit && urlFromFilter}
		<Button href={urlFromFilter(activeFilter)}>Apply</Button>
	{/if}
</div>
