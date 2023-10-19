<script lang="ts">
	import type { JournalFilterSchemaType } from '$lib/schema/journalSchema';
	import { Button, Modal } from 'flowbite-svelte';
	import FilterIcon from './icons/FilterIcon.svelte';
	import FilterModalContent from './FilterModalContent.svelte';

	export let currentFilter: JournalFilterSchemaType;

	let opened = false;
</script>

<Button color="light" on:click={() => (opened = true)}>
	<FilterIcon />
</Button>
<Modal bind:open={opened} size="lg" title="Journal Filter">
	<FilterModalContent {currentFilter} />
</Modal>
