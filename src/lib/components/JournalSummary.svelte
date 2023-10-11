<script lang="ts">
	import type { JournalSummaryType } from '$lib/server/db/actions/journalActions';
	import { Badge, Button, Modal, Popover } from 'flowbite-svelte';
	import type { currencyFormatType } from '$lib/schema/userSchema';
	import DisplayCurrency from './DisplayCurrency.svelte';
	import JournalSummaryPopoverContent from './JournalSummaryPopoverContent.svelte';

	export let href: string;
	export let id: string;
	export let items: Promise<(JournalSummaryType & { id: string })[]> | Promise<JournalSummaryType>;
	export let format: currencyFormatType = 'USD';
	export let summaryTitle: string = 'Summary';
	export let onYearMonthClick: (yearMonth: string) => void = () => {};

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
			...
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
			Loading
		{:then matchingItem}
			{#if matchingItem}
				<JournalSummaryPopoverContent item={matchingItem} {href} {format} {onYearMonthClick} />
			{:else}
				Error
			{/if}
		{/await}
	</Modal>
</div>
