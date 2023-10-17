<script lang="ts">
	import { Badge, Button, Dropdown } from 'flowbite-svelte';
	import FilterIcon from './icons/FilterIcon.svelte';
	import CategoryIcon from './icons/CategoryIcon.svelte';
	import { urlGenerator } from '$lib/routes';
	import { defaultJournalFilter, type JournalFilterSchemaType } from '$lib/schema/journalSchema';
	import JournalEntryIcon from './icons/JournalEntryIcon.svelte';
	export let data: { categoryId: string | null; categoryTitle: string | null };
	export let currentFilter: JournalFilterSchemaType;

	let opened = false;

	$: filterURL = urlGenerator({
		address: '/(loggedIn)/journals',
		searchParamsValue: {
			...currentFilter,
			category: {
				id: data.categoryId || undefined
			}
		}
	}).url;

	$: viewURL = urlGenerator({
		address: '/(loggedIn)/journals',
		searchParamsValue: {
			...defaultJournalFilter,
			category: {
				id: data.categoryId || undefined
			}
		}
	}).url;
</script>

{#if data.categoryTitle && data.categoryId}
	<Badge class="gap-2" on:click={() => (opened = true)}>
		<CategoryIcon />
		{data.categoryTitle}
	</Badge>
	<Dropdown bind:open={opened} class="p-2 w-52" border>
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
