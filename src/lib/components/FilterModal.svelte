<script
	lang="ts"
	generics="F extends JournalFilterSchemaType | JournalFilterSchemaWithoutPaginationType"
>
	import type {
		JournalFilterSchemaType,
		JournalFilterSchemaWithoutPaginationType
	} from '$lib/schema/journalSchema';
	import { Button, Modal } from 'flowbite-svelte';
	import FilterIcon from './icons/FilterIcon.svelte';
	import FilterModalContent from './FilterModalContent.svelte';

	type dropdownItemsType = {
		id: string;
		title: string;
		enabled: boolean;
		group?: string;
	};

	export let currentFilter: F;
	export let accountDropdown: Promise<dropdownItemsType[]>;
	export let billDropdown: Promise<dropdownItemsType[]>;
	export let budgetDropdown: Promise<dropdownItemsType[]>;
	export let categoryDropdown: Promise<dropdownItemsType[]>;
	export let tagDropdown: Promise<dropdownItemsType[]>;
	export let labelDropdown: Promise<dropdownItemsType[]>;
	export let urlFromFilter: ((filter: F) => string) | undefined = undefined;
	export let opened = false;

	let url = '';

	let activeFilter = currentFilter;
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
		bind:url
		bind:activeFilter
	/>
	<svelte:fragment slot="footer">
		<slot name="footerContents" {activeFilter}>
			<Button on:click={() => (opened = false)} outline>Cancel</Button>
			<div class="flex-grow"></div>
			<Button href={url}>Apply</Button>
		</slot>
	</svelte:fragment>
</Modal>
