<script lang="ts">
	import type { JournalFilterSchemaType } from '$lib/schema/journalSchema';
	import { Button, Accordion, AccordionItem } from 'flowbite-svelte';
	import JournalEntryFilter from './filters/JournalEntryFilter.svelte';
	import AccountFilter from './filters/AccountFilter.svelte';
	import BillFilter from './filters/BillFilter.svelte';
	import BudgetFilter from './filters/BudgetFilter.svelte';
	import CategoryFilter from './filters/CategoryFilter.svelte';
	import TagFilter from './filters/TagFilter.svelte';
	import LabelFilter from './filters/LabelFilter.svelte';
	import PayeeFilter from './filters/PayeeFilter.svelte';

	type dropdownItemsType = {
		id: string;
		title: string;
		enabled: boolean;
		group?: string;
	};

	export let currentFilter: JournalFilterSchemaType;
	export let accountDropdown: Promise<dropdownItemsType[]>;
	export let billDropdown: Promise<dropdownItemsType[]>;
	export let budgetDropdown: Promise<dropdownItemsType[]>;
	export let categoryDropdown: Promise<dropdownItemsType[]>;
	export let tagDropdown: Promise<dropdownItemsType[]>;
	export let labelDropdown: Promise<dropdownItemsType[]>;
	export let urlFromFilter: (filter: JournalFilterSchemaType) => string;
	export let hideSubmit = false;
	export let url = '';

	$: activeFilter = currentFilter;
	$: url = urlFromFilter(activeFilter);
</script>

<div class="flex flex-col gap-6">
	<Accordion>
		<AccordionItem>
			<svelte:fragment slot="header">Journal Entry</svelte:fragment>
			<JournalEntryFilter bind:activeFilter />
		</AccordionItem>
		<AccordionItem>
			<svelte:fragment slot="header">Account</svelte:fragment>
			{#await accountDropdown then accountDropdownResolved}
				<AccountFilter
					bind:filter={activeFilter.account}
					accountDetails={accountDropdownResolved}
				/>
			{/await}
		</AccordionItem>
		<AccordionItem>
			<svelte:fragment slot="header">Payee</svelte:fragment>
			{#await accountDropdown then accountDropdownResolved}
				<PayeeFilter bind:filter={activeFilter.payee} accountDetails={accountDropdownResolved} />
			{/await}
		</AccordionItem>
		<AccordionItem>
			<svelte:fragment slot="header">Bill</svelte:fragment>
			{#await billDropdown then billDropdownResolved}
				<BillFilter bind:filter={activeFilter.bill} billDetails={billDropdownResolved} />
			{/await}
		</AccordionItem>
		<AccordionItem>
			<svelte:fragment slot="header">Budget</svelte:fragment>
			{#await budgetDropdown then budgetDropdownResolved}
				<BudgetFilter bind:filter={activeFilter.budget} budgetDetails={budgetDropdownResolved} />
			{/await}
		</AccordionItem>
		<AccordionItem>
			<svelte:fragment slot="header">Category</svelte:fragment>
			{#await categoryDropdown then categoryDropdownResolved}
				<CategoryFilter
					bind:filter={activeFilter.category}
					categoryDetails={categoryDropdownResolved}
				/>
			{/await}
		</AccordionItem>
		<AccordionItem>
			<svelte:fragment slot="header">Tag</svelte:fragment>
			{#await tagDropdown then tagDropdownResolved}
				<TagFilter bind:filter={activeFilter.tag} tagDetails={tagDropdownResolved} />
			{/await}
		</AccordionItem>
		<AccordionItem>
			<svelte:fragment slot="header">Label</svelte:fragment>
			{#await labelDropdown then labelDropdownResolved}
				<LabelFilter bind:filter={activeFilter.label} labelDetails={labelDropdownResolved} />
			{/await}
		</AccordionItem>
		<AccordionItem>
			<svelte:fragment slot="header">Current Filter Raw</svelte:fragment>
			<pre>{JSON.stringify(activeFilter, null, 2)}</pre>
		</AccordionItem>
	</Accordion>
	{#if !hideSubmit}
		<Button href={urlFromFilter(activeFilter)}>Apply</Button>
	{/if}
</div>
