<script lang="ts">
	import { Badge, Button, Dropdown } from 'flowbite-svelte';
	import FilterIcon from './icons/FilterIcon.svelte';
	import { urlGenerator } from '$lib/routes';
	import { defaultJournalFilter, type JournalFilterSchemaType } from '$lib/schema/journalSchema';
	import JournalEntryIcon from './icons/JournalEntryIcon.svelte';
	import LabelIcon from './icons/LabelIcon.svelte';

	const {
		data,
		currentFilter
	}: {
		data: { id: string | null; title: string | null };

		currentFilter: JournalFilterSchemaType;
	} = $props();

	let opened = $state(false);

	const filterURL = $derived(
		urlGenerator({
			address: '/(loggedIn)/journals',
			searchParamsValue: {
				...currentFilter,
				label: {
					id: data.id || undefined
				}
			}
		}).url
	);

	const viewURL = $derived(
		urlGenerator({
			address: '/(loggedIn)/journals',
			searchParamsValue: {
				...defaultJournalFilter(),
				label: {
					id: data.id || undefined
				}
			}
		}).url
	);
</script>

{#if data.title && data.id}
	<Badge class="gap-2" on:click={() => (opened = true)}>
		<LabelIcon />
		{data.title}
	</Badge>
	<Dropdown bind:open={opened} class="w-52 p-2" border>
		<div class="flex flex-col gap-1">
			{#if data.title}
				<div class="flex">
					{data.title}
				</div>
			{/if}
			<div class="flex flex-row justify-between">
				<Button href={viewURL} outline color="light" size="xs"><JournalEntryIcon /></Button>
				<Button href={filterURL} outline color="light" size="xs"><FilterIcon /></Button>
			</div>
		</div>
	</Dropdown>
{/if}
