<script lang="ts">
	import type { JournalFilterSchemaType } from '$lib/schema/journalSchema';
	import { Button, Accordion, AccordionItem } from 'flowbite-svelte';
	import { urlGenerator } from '$lib/routes';
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
	export let accountDropdown: dropdownItemsType[];
	export let billDropdown: dropdownItemsType[];
	export let budgetDropdown: dropdownItemsType[];
	export let categoryDropdown: dropdownItemsType[];
	export let tagDropdown: dropdownItemsType[];
	export let labelDropdown: dropdownItemsType[];

	$: activeFilter = currentFilter;
</script>

<div class="flex flex-col gap-6">
	<Accordion>
		<AccordionItem>
			<svelte:fragment slot="header">Journal Entry</svelte:fragment>
			<JournalEntryFilter bind:activeFilter />
		</AccordionItem>
		<AccordionItem>
			<svelte:fragment slot="header">Account</svelte:fragment>
			<AccountFilter bind:filter={activeFilter.account} accountDetails={accountDropdown} />
		</AccordionItem>
		<AccordionItem>
			<svelte:fragment slot="header">Payee</svelte:fragment>
			<PayeeFilter bind:filter={activeFilter.payee} accountDetails={accountDropdown} />
		</AccordionItem>
		<AccordionItem>
			<svelte:fragment slot="header">Bill</svelte:fragment>
			<BillFilter bind:filter={activeFilter.bill} billDetails={billDropdown} />
		</AccordionItem>
		<AccordionItem>
			<svelte:fragment slot="header">Budget</svelte:fragment>
			<BudgetFilter bind:filter={activeFilter.budget} budgetDetails={budgetDropdown} />
		</AccordionItem>
		<AccordionItem>
			<svelte:fragment slot="header">Category</svelte:fragment>
			<CategoryFilter bind:filter={activeFilter.category} categoryDetails={categoryDropdown} />
		</AccordionItem>
		<AccordionItem>
			<svelte:fragment slot="header">Tag</svelte:fragment>
			<TagFilter bind:filter={activeFilter.tag} tagDetails={tagDropdown} />
		</AccordionItem>
		<AccordionItem>
			<svelte:fragment slot="header">Label</svelte:fragment>
			<LabelFilter bind:filter={activeFilter.label} labelDetails={labelDropdown} />
		</AccordionItem>
		<AccordionItem>
			<svelte:fragment slot="header">Current Filter Raw</svelte:fragment>

			<pre>{JSON.stringify(activeFilter, null, 2)}</pre>
		</AccordionItem>
	</Accordion>
	<Button
		href={urlGenerator({ address: '/(loggedIn)/journals', searchParamsValue: activeFilter }).url}
	>
		Apply
	</Button>
</div>
