<script lang="ts">
	import AscendingIcon from '~icons/mdi/sort-reverse-variant';
	import DescendingIcon from '~icons/mdi/sort-variant';
	import NoOrderIcon from '~icons/bi/dash';
	import type { ComponentProps } from 'svelte';

	type IconProps = ComponentProps<typeof AscendingIcon>;

	const {
		direction,
		...restProps
	}: {
		direction?: 'asc' | 'desc';
	} & IconProps = $props();
</script>

{#if direction === 'asc'}
	<AscendingIcon {...restProps} />
{:else if direction === 'desc'}
	<DescendingIcon {...restProps} />
{:else}
	<NoOrderIcon {...restProps} />
{/if}
