<script lang="ts">
	import AscendingIcon from '~icons/mdi/chevron-up';
	import DescendingIcon from '~icons/mdi/chevron-down';
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
