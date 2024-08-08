<script lang="ts">
	import { Badge, Button, Dropdown } from 'flowbite-svelte';
	import FilterIcon from './icons/FilterIcon.svelte';
	import TagIcon from './icons/TagIcon.svelte';
	import { urlGenerator } from '$lib/routes';
	import { defaultJournalFilter, type JournalFilterSchemaType } from '$lib/schema/journalSchema';
	import JournalEntryIcon from './icons/JournalEntryIcon.svelte';

	const {
		data,
		currentFilter
	}: {
		data: { tagId: string | null; tagTitle: string | null };
		currentFilter: JournalFilterSchemaType;
	} = $props();

	let opened = $state(false);

	const filterURL = $derived(
		urlGenerator({
			address: '/(loggedIn)/journals',
			searchParamsValue: {
				...currentFilter,
				tag: {
					id: data.tagId || undefined
				}
			}
		}).url
	);

	const viewURL = $derived(
		urlGenerator({
			address: '/(loggedIn)/journals',
			searchParamsValue: {
				...defaultJournalFilter(),
				tag: {
					id: data.tagId || undefined
				}
			}
		}).url
	);
</script>

{#if data.tagTitle && data.tagId}
	<Badge class="gap-2" on:click={() => (opened = true)}>
		<TagIcon />
		{data.tagTitle}
	</Badge>
	<Dropdown bind:open={opened} class="w-52 p-2" border>
		<div class="flex flex-col gap-1">
			{#if data.tagTitle}
				<div class="flex">
					{data.tagTitle}
				</div>
			{/if}
			<div class="flex flex-row justify-between">
				<Button href={viewURL} outline color="light" size="xs"><JournalEntryIcon /></Button>
				<Button href={filterURL} outline color="light" size="xs"><FilterIcon /></Button>
			</div>
		</div>
	</Dropdown>
{/if}
