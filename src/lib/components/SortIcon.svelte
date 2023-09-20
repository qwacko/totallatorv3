<script lang="ts">
	import AscendingIcon from '~icons/mdi/sort-reverse-variant';
	import DescendingIcon from '~icons/mdi/sort-variant';
	import NoOrderIcon from '~icons/bi/dash';

	export let direction: 'asc' | 'desc' | undefined = undefined;
</script>

{#if direction === 'asc'}
	<AscendingIcon {...$$restProps} />
{:else if direction === 'desc'}
	<DescendingIcon {...$$restProps} />
{:else}
	<NoOrderIcon {...$$restProps} />
{/if}
