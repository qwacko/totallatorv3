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
	import type { Snippet } from 'svelte';

	let {
		currentFilter,
		urlFromFilter,
		opened = $bindable(false),
		hideDates = false,
		modalTitle = 'Journal Filter',
		slotFooterContents
	}: {
		currentFilter: F;
		urlFromFilter?: (filter: F) => string;
		opened?: boolean;
		hideDates?: boolean;
		modalTitle?: string;
		slotFooterContents?: Snippet<[{ activeFilter: F }]>;
	} = $props();

	let url = $state('');
	let activeFilter = $state(currentFilter);
</script>

<Button color="light" on:click={() => (opened = true)}>
	<FilterIcon />
</Button>
<Modal bind:open={opened} size="lg" title={modalTitle} outsideclose>
	<FilterModalContent {currentFilter} {urlFromFilter} {hideDates} bind:url bind:activeFilter />
	<svelte:fragment slot="footer">
		{#if slotFooterContents}
			{@render slotFooterContents({ activeFilter })}
		{:else}
			<Button on:click={() => (opened = false)} outline>Cancel</Button>
			<div class="flex-grow"></div>
			<Button href={url}>Apply</Button>
		{/if}
	</svelte:fragment>
</Modal>
