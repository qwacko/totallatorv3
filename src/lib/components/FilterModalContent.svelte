<script lang="ts">
	import type { JournalFilterSchemaType } from '$lib/schema/journalSchema';
	import { Button, Accordion, AccordionItem } from 'flowbite-svelte';
	import { urlGenerator } from '$lib/routes';
	import JournalEntryFilter from './filters/JournalEntryFilter.svelte';
	import AccountFilter from './filters/AccountFilter.svelte';

	export let currentFilter: JournalFilterSchemaType;

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
			<AccountFilter bind:filter={activeFilter.account} />
		</AccordionItem>
		<AccordionItem>
			<svelte:fragment slot="header">Payee</svelte:fragment>
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
