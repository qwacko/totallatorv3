<script lang="ts">
	import type { JournalSummaryType } from '$lib/server/db/actions/journalActions';
	import { Badge, Popover } from 'flowbite-svelte';
	import type { currencyFormatType } from '$lib/schema/userSchema';
	import DisplayCurrency from './DisplayCurrency.svelte';
	import JournalSummaryPopoverContent from './JournalSummaryPopoverContent.svelte';

	export let href: string;
	export let id: string;
	export let items: Promise<(JournalSummaryType & { id: string })[]>;
	export let format: currencyFormatType = 'USD';
</script>

<Badge {href} {...$$restProps}>
	{#await items}
		...
	{:then resolvedItems}
		{@const matchingItem = resolvedItems.find((item) => item.id === id)}
		{#if matchingItem}
			<div class="flex flex-row gap-1">
				<DisplayCurrency amount={matchingItem.sum} {format} />
			</div>
		{:else}
			Error
		{/if}
	{/await}
</Badge>
<Popover>
	{#await items}
		Loading
	{:then resolvedItems}
		{@const matchingItem = resolvedItems.find((item) => item.id === id)}
		{#if matchingItem}
			<JournalSummaryPopoverContent item={matchingItem} {href} {format} />
		{:else}
			Error
		{/if}
	{/await}
</Popover>
