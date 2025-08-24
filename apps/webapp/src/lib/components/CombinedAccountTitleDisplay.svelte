<script lang="ts">
	import { combinedAccountTitleSplitRequired } from '$lib/helpers/combinedAccountTitleSplit';

	const { title, accountGroupCombined }: { title: string; accountGroupCombined: string } = $props();

	const titleSplit = $derived(combinedAccountTitleSplitRequired({ title, accountGroupCombined }));
</script>

<div class="flex flex-col gap-1">
	<div class="flex flex-row gap-2 text-sm">
		<div class="flex font-medium">Account Group</div>
		<div class="flex">{titleSplit.accountGroup || ''}</div>
	</div>
	<div class="flex flex-row gap-2 text-sm">
		<div class="flex font-medium">Account Group 2</div>
		<div class="flex">{titleSplit.accountGroup2 || ''}</div>
	</div>
	<div class="flex flex-row gap-2 text-sm">
		<div class="flex font-medium">Account Group 3</div>
		<div class="flex">{titleSplit.accountGroup3 || ''}</div>
	</div>
</div>
