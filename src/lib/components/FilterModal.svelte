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


	export let currentFilter: F;
	export let urlFromFilter: ((filter: F) => string) | undefined = undefined;
	export let opened = false;
	export let hideDates = false;
	export let modalTitle = 'Journal Filter';

	let url = '';

	let activeFilter = currentFilter;
</script>

<Button color="light" on:click={() => (opened = true)}>
	<FilterIcon />
</Button>
<Modal bind:open={opened} size="lg" title={modalTitle} outsideclose>
	<FilterModalContent
		{currentFilter}
		{urlFromFilter}
		{hideDates}
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
