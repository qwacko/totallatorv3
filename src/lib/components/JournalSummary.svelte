<script lang="ts">
	import { Badge, Button, Modal, Popover, Spinner } from 'flowbite-svelte';
	import type { currencyFormatType } from '$lib/schema/userSchema';
	import DisplayCurrency from './DisplayCurrency.svelte';
	import JournalSummaryPopoverContent from './JournalSummaryPopoverContent.svelte';
	import type { JournalSummaryPropType } from './helpers/JournalSummaryPropType';
	import type { JournalFilterSchemaInputType } from '$lib/schema/journalSchema';
	import type { DeepPartialWithoutArray } from '$lib/helpers/DeepPartialType';

	export let id: string;
	export let items: JournalSummaryPropType;
	export let format: currencyFormatType = 'USD';
	export let summaryTitle: string = 'Summary';
	export let summaryFilter: DeepPartialWithoutArray<
		Omit<JournalFilterSchemaInputType, 'orderBy' | 'page' | 'pageSize'>
	> = {};

	$: getItems = async () => {
		const resolvedItems = await items;
		if (Array.isArray(resolvedItems)) {
			return resolvedItems.find((item) => item.id === id);
		} else {
			return resolvedItems;
		}
	};

	let showModal = false;
</script>

<div class="flex">
	<Button
		color="light"
		outline
		size="xs"
		class="text-xs w-24"
		on:click={() => {
			console.log('Clicked Badge');
			showModal = true;
		}}
		{...$$restProps}
	>
		{#await getItems()}
			<div class="flex flex-row gap-1">
				<div class="flex">Loading...</div>
			</div>
		{:then matchingItem}
			{#if matchingItem}
				<div class="flex flex-row gap-1">
					<DisplayCurrency amount={matchingItem.sum} {format} />
				</div>
			{:else}
				Error
			{/if}
		{/await}
	</Button>
	<Modal title={summaryTitle} bind:open={showModal} outsideclose>
		{#await getItems()}
			<Spinner />
		{:then matchingItem}
			{#if matchingItem}
				<JournalSummaryPopoverContent item={matchingItem} {format} {summaryFilter} />
			{:else}
				Error
			{/if}
		{/await}
	</Modal>
</div>
