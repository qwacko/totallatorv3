<script lang="ts">
	import type { JournalFilterSchemaType } from '$lib/schema/journalSchema';
	import { Button, Input, Accordion, AccordionItem, ButtonGroup } from 'flowbite-svelte';
	import TextInput from './TextInput.svelte';
	import { urlGenerator } from '$lib/routes';
	import DateInput from './DateInput.svelte';
	import CancelIcon from './icons/CancelIcon.svelte';

	export let currentFilter: JournalFilterSchemaType;

	let yearMonth: string = '';

	$: activeFilter = currentFilter;
</script>

<div class="flex flex-col gap-6">
	<Accordion>
		<AccordionItem>
			<svelte:fragment slot="header">Journal Entry</svelte:fragment>
			<div class="flex flex-col gap-2">
				{#if activeFilter.id}
					<div class="flex flex-row gap-2">
						<div class="flex">ID is {activeFilter.id}</div>
						<Button color="none" on:click={() => (activeFilter.id = undefined)}>
							<CancelIcon />
						</Button>
					</div>
				{/if}
				{#if activeFilter.idArray && activeFilter.idArray.length > 0}
					<div class="flex font-semibold text-black text-sm">Journal IDs</div>
					<div class="flex flex-row gap-2 flex-wrap">
						{#each activeFilter.idArray as currentId}
							<Button
								class="whitespace-nowrap"
								size="xs"
								color="light"
								on:click={() =>
									activeFilter.idArray &&
									(activeFilter.idArray = activeFilter.idArray.filter(
										(item) => item !== currentId
									))}
							>
								{currentId}
							</Button>{/each}
					</div>
				{/if}
				{#if activeFilter.transactionIdArray && activeFilter.transactionIdArray.length > 0}
					<div class="flex font-semibold text-black text-sm">Transaction IDs</div>
					<div class="flex flex-row gap-2 flex-wrap">
						{#each activeFilter.transactionIdArray as currentId}
							<Button
								class="whitespace-nowrap"
								size="xs"
								color="light"
								on:click={() =>
									activeFilter.transactionIdArray &&
									(activeFilter.transactionIdArray = activeFilter.transactionIdArray.filter(
										(item) => item !== currentId
									))}
							>
								{currentId}
							</Button>{/each}
					</div>
				{/if}
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
				<ButtonGroup>
					<Button
						outline={activeFilter.complete !== true}
						color="primary"
						on:click={() => (activeFilter.complete = true)}
						class="flex flex-grow basis-0"
					>
						Complete
					</Button>
					<Button
						outline={activeFilter.complete !== false}
						color="primary"
						on:click={() => (activeFilter.complete = false)}
						class="flex flex-grow basis-0"
					>
						Incomplete
					</Button>
					<Button
						outline={activeFilter.complete !== undefined}
						color="primary"
						on:click={() => (activeFilter.complete = undefined)}
						class="flex flex-grow basis-0"
					>
						Any
					</Button>
				</ButtonGroup>
			</div>
		</AccordionItem>
		<AccordionItem>
			<svelte:fragment slot="header">Current Filter Raw</svelte:fragment>

			<pre>{JSON.stringify(activeFilter, null, 2)}</pre>
		</AccordionItem>
	</Accordion>
	<Button
		href={urlGenerator({ address: '/(loggedIn)/journals', searchParamsValue: activeFilter }).url}
	>
		Apply
	</Button>
</div>
