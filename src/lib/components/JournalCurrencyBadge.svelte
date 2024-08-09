<script lang="ts">
	import { Badge } from 'flowbite-svelte';
	import DisplayCurrency from './DisplayCurrency.svelte';
	import type { ComponentProps } from 'svelte';

	type BadgeProps = ComponentProps<Badge>;

	const {
		href,
		id,
		items,
		...restProps
	}: { href: string; id: string; items: Promise<{ id: string; sum: number }[]> } & Omit<
		BadgeProps,
		'href'
	> = $props();
</script>

<Badge {href} {...restProps}>
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
