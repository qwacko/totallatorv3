<script lang="ts">
	import { Badge, Button, Dropdown } from 'flowbite-svelte';

	import { defaultJournalFilter, type JournalFilterSchemaType } from '@totallator/shared';

	import { urlGenerator } from '$lib/routes';

	import CategoryIcon from './icons/CategoryIcon.svelte';
	import FilterIcon from './icons/FilterIcon.svelte';
	import JournalEntryIcon from './icons/JournalEntryIcon.svelte';

	const {
		data,
		currentFilter
	}: {
		data: { categoryId: string | null; categoryTitle: string | null };
		currentFilter: JournalFilterSchemaType;
	} = $props();

	let opened = $state(false);

	const filterURL = $derived(
		urlGenerator({
			address: '/(loggedIn)/journals',
			searchParamsValue: {
				...currentFilter,
				category: {
					id: data.categoryId || undefined
				}
			}
		}).url
	);

	const viewURL = $derived(
		urlGenerator({
			address: '/(loggedIn)/journals',
			searchParamsValue: {
				...defaultJournalFilter(),
				category: {
					id: data.categoryId || undefined
				}
			}
		}).url
	);
</script>

{#if data.categoryTitle && data.categoryId}
	<Badge class="gap-2" onclick={() => (opened = true)}>
		<CategoryIcon />
		{data.categoryTitle}
	</Badge>
	<Dropdown bind:isOpen={opened} class="w-52 border p-2" simple>
		<div class="flex flex-col gap-1">
			{#if data.categoryTitle}
				<div class="flex">
					{data.categoryTitle}
				</div>
			{/if}
			<div class="flex flex-row justify-between">
				<Button href={viewURL} outline color="light" size="xs"><JournalEntryIcon /></Button>
				<Button href={filterURL} outline color="light" size="xs"><FilterIcon /></Button>
			</div>
		</div>
	</Dropdown>
{/if}
