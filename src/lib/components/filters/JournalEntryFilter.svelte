<script lang="ts">
	import type { JournalFilterSchemaType } from '$lib/schema/journalSchema';
	import { Input, Button } from 'flowbite-svelte';
	import DateInput from '../DateInput.svelte';
	import TextInput from '../TextInput.svelte';
	import BooleanFilterButtons from './BooleanFilterButtons.svelte';
	import FilterIdArray from './FilterIdArray.svelte';
	import IdFilter from './IDFilter.svelte';

	export let activeFilter: JournalFilterSchemaType;
	let yearMonth: string = '';
</script>

<div class="flex flex-col gap-2">
	<IdFilter bind:id={activeFilter.id} />
	<FilterIdArray title="Journal IDs" bind:idArray={activeFilter.idArray} />
	<FilterIdArray title="Transaction IDs" bind:idArray={activeFilter.transactionIdArray} />
	<FilterIdArray title="Import IDs" bind:idArray={activeFilter.importIdArray} />
	<FilterIdArray title="Import Detail IDs" bind:idArray={activeFilter.importDetailIdArray} />
	<div class="flex font-semibold text-black text-sm">Year Month</div>
	<div class="flex flex-row gap-1">
		<Input
			bind:value={yearMonth}
			class="flex flex-grow"
			placeholder="year-month (i.e. 2020-12)..."
		/>
		<Button
			on:click={() =>
				activeFilter.yearMonth
					? (activeFilter.yearMonth = [...activeFilter.yearMonth, yearMonth])
					: (activeFilter.yearMonth = [yearMonth])}
		>
			Add
		</Button>
	</div>
	{#if activeFilter.yearMonth && activeFilter.yearMonth.length > 0}
		<div class="flex flex-row gap-2 flex-wrap">
			{#each activeFilter.yearMonth as currentYearMonth}
				<Button
					class="whitespace-nowrap"
					size="xs"
					color="light"
					on:click={() =>
						activeFilter.yearMonth &&
						(activeFilter.yearMonth = activeFilter.yearMonth.filter(
							(item) => item !== currentYearMonth
						))}
				>
					{currentYearMonth}
				</Button>{/each}
		</div>
	{/if}
	<TextInput
		bind:value={activeFilter.description}
		name="description"
		title="Description"
		errorMessage=""
	/>
	<DateInput
		bind:value={activeFilter.dateAfter}
		name="dateAfter"
		title="Start Date"
		errorMessage=""
	/>
	<DateInput
		bind:value={activeFilter.dateBefore}
		name="dateBefore"
		title="End Date"
		errorMessage=""
	/>

	<div class="flex font-semibold text-black text-sm">Status</div>
	<BooleanFilterButtons bind:value={activeFilter.complete} />
	<div class="flex font-semibold text-black text-sm">Data Checked</div>
	<BooleanFilterButtons bind:value={activeFilter.dataChecked} />
	<div class="flex font-semibold text-black text-sm">Reconciled</div>
	<BooleanFilterButtons bind:value={activeFilter.reconciled} />
</div>