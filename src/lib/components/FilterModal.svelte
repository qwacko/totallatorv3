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
	export let accountDropdown: dropdownItemsType[];
	export let billDropdown: dropdownItemsType[];
	export let budgetDropdown: dropdownItemsType[];
	export let categoryDropdown: dropdownItemsType[];
	export let tagDropdown: dropdownItemsType[];
	export let labelDropdown: dropdownItemsType[];

	let opened = false;
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
	/>
</Modal>
