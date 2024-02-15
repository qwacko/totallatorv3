<script lang="ts">
	import { Badge } from 'flowbite-svelte';
	import DisplayCurrency from './DisplayCurrency.svelte';

	export let href: string;
	export let id: string;
	export let items: Promise<{ id: string; sum: number }[]>;
</script>

<Badge {href} {...$$restProps}>
	{#await items}
		...
	{:then resolvedItems}
		{@const matchingItem = resolvedItems.find((item) => item.id === id)}
		{#if matchingItem}
			<DisplayCurrency amount={matchingItem.sum} />
		{:else}
			Error
		{/if}
	{/await}
</Badge>
