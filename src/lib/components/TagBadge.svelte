<script lang="ts">
	import { Badge, Button, Dropdown } from 'flowbite-svelte';
	import type { JournalSummaryPropType } from './helpers/JournalSummaryPropType';
	import JournalSummary from './JournalSummary.svelte';
	import FilterIcon from './icons/FilterIcon.svelte';
	import { urlGenerator } from '$lib/routes';
	import { defaultJournalFilter } from '$lib/schema/journalSchema';
	import TagIcon from './icons/TagIcon.svelte';
	import { goto } from '$app/navigation';

	export let data: { tagId: string | null; tagTitle: string | null };

	export let summaryData: JournalSummaryPropType | undefined = undefined;
	export let filterURL: string | undefined = undefined;

	let opened = false;
</script>

{#if data.tagTitle && data.tagId}
	<Badge class="gap-2" on:click={() => (opened = true)}>
		<TagIcon />
		{data.tagTitle}
	</Badge>
	<Dropdown bind:open={opened} class="p-2 w-52" border>
		<div class="flex flex-col gap-1">
			{#if data.tagTitle}
				<div class="flex">
					{data.tagTitle}
				</div>
			{/if}
			<div class="flex flex-row">
				{#if summaryData}
					<JournalSummary
						id={data.tagId || 'dummy'}
						items={summaryData}
						format="USD"
						summaryTitle="{data.tagTitle || ''} Summary"
						href={urlGenerator({
							address: '/(loggedIn)/journals',
							searchParamsValue: { ...defaultJournalFilter, tag: { id: data.tagId } }
						}).url}
						onYearMonthClick={(yearMonth) => {
							if (data.tagId) {
								goto(
									urlGenerator({
										address: '/(loggedIn)/journals',
										searchParamsValue: {
											...defaultJournalFilter,
											tag: { id: data.tagId },
											yearMonth: [yearMonth]
										}
									}).url
								);
							}
						}}
					/>
				{/if}
				<div class="flex flex-grow" />
				{#if filterURL}
					<Button href={filterURL} outline color="light" size="xs"><FilterIcon /></Button>
				{/if}
			</div>
		</div>
	</Dropdown>
{/if}
