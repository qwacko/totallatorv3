<script lang="ts">
	import { Badge, Button, Dropdown } from 'flowbite-svelte';
	import type { JournalSummaryPropType } from './helpers/JournalSummaryPropType';
	import JournalSummary from './JournalSummary.svelte';
	import FilterIcon from './icons/FilterIcon.svelte';
	import { urlGenerator } from '$lib/routes';
	import { defaultJournalFilter } from '$lib/schema/journalSchema';
	import BillIcon from './icons/BillIcon.svelte';
	import { goto } from '$app/navigation';

	export let data: { billId: string | null; billTitle: string | null };

	export let summaryData: JournalSummaryPropType | undefined = undefined;
	export let filterURL: string | undefined = undefined;

	let opened = false;
</script>

{#if data.billTitle && data.billId}
	<Badge class="gap-2" on:click={() => (opened = true)}>
		<BillIcon />
		{data.billTitle}
	</Badge>
	<Dropdown bind:open={opened} class="p-2 w-52" border>
		<div class="flex flex-col gap-1">
			{#if data.billTitle}
				<div class="flex">
					{data.billTitle}
				</div>
			{/if}
			<div class="flex flex-row">
				{#if summaryData}
					<JournalSummary
						id={data.billId || 'dummy'}
						items={summaryData}
						format="USD"
						summaryTitle="{data.billTitle || ''} Summary"
						href={urlGenerator({
							address: '/(loggedIn)/journals',
							searchParamsValue: { ...defaultJournalFilter, bill: { id: data.billId } }
						}).url}
						onYearMonthClick={(yearMonth) => {
							if (data.billId) {
								goto(
									urlGenerator({
										address: '/(loggedIn)/journals',
										searchParamsValue: {
											...defaultJournalFilter,
											bill: { id: data.billId },
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
