<script lang="ts">
	import { Badge, Button, Dropdown } from 'flowbite-svelte';

	import { defaultJournalFilter, type JournalFilterSchemaType } from '@totallator/shared';

	import { urlGenerator } from '$lib/routes';

	import FilterIcon from './icons/FilterIcon.svelte';
	import JournalEntryIcon from './icons/JournalEntryIcon.svelte';
	import TagIcon from './icons/TagIcon.svelte';

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
	<Badge class="gap-2" onclick={() => (opened = true)}>
		<TagIcon />
		{data.tagTitle}
	</Badge>
	<Dropdown bind:isOpen={opened} class="w-52 border p-2" simple>
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
