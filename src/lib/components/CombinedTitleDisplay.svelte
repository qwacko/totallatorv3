<script lang="ts">
	import { combinedTitleSplit } from '$lib/helpers/combinedTitleSplit';

	export let title: string | undefined = undefined;

	$: titleSplit = combinedTitleSplit({ title });
</script>

{#if titleSplit.group || titleSplit.single}
	<div class="flex flex-row gap-2 text-sm">
		<div class="flex font-medium">Group</div>
		<div class="flex">{titleSplit.group || ''}</div>
	</div>
	<div class="flex flex-row gap-2 text-sm">
		<div class="flex font-medium">Single</div>
		<div class="flex">{titleSplit.single || ''}</div>
	</div>
{/if}
