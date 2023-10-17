<script lang="ts">
	import { Badge } from 'flowbite-svelte';

	export let href: string;
	export let id: string;
	export let items: Promise<{ id: string; count: number }[]>;
</script>

<Badge {href} {...$$restProps}>
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
