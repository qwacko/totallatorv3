<script lang="ts">
	import type { JournalFilterSchemaType } from '$lib/schema/journalSchema';
	import { Button, Modal } from 'flowbite-svelte';
	import FilterIcon from './icons/FilterIcon.svelte';
	import FilterModalContent from './FilterModalContent.svelte';

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
	export let opened = false;
</script>

<Button color="light" on:click={() => (opened = true)}>
	<FilterIcon />
</Button>
<Modal bind:open={opened} size="lg" title="Journal Filter">
	<FilterModalContent
		{currentFilter}
		{accountDropdown}
		{billDropdown}
		{budgetDropdown}
		{categoryDropdown}
		{tagDropdown}
		{labelDropdown}
		{urlFromFilter}
	/>
	<svelte:fragment slot="footer">
		<Button on:click={() => (opened = false)} outline>Cancel</Button>
		<div class="flex-grow"></div>
		<Button href={urlFromFilter(currentFilter)}>Apply</Button>
	</svelte:fragment>
</Modal>
