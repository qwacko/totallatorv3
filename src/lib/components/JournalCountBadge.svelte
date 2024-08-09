<script lang="ts">
	import { Badge } from 'flowbite-svelte';
	import type { ComponentProps } from 'svelte';

	type BadgeProps = ComponentProps<Badge>;

	const {
		href,
		id,
		items,
		...restProps
	}: {
		href: string;
		id: string;
		items: Promise<{ id: string; count: number }[]>;
	} & Omit<BadgeProps, 'href'> = $props();
</script>

<Badge {href} {...restProps}>
	{#await items}
		...
	{:then resolvedItems}
		{@const matchingItem = resolvedItems.find((item) => item.id === id)}
		{#if matchingItem}
			{matchingItem.count}
		{:else}
			Error
		{/if}
	{/await}
</Badge>
