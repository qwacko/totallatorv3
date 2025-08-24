<script lang="ts">
	import { Badge, Spinner, Tooltip } from 'flowbite-svelte';

	import type { ReportConfigPartWithData_String } from '@totallator/business-logic';

	const { data }: { data: ReportConfigPartWithData_String } = $props();
</script>

<div class="flex h-full w-full items-center justify-center">
	{#await data.data}
		<Spinner />
	{:then currentData}
		{#if 'errorMessage' in currentData}
			<Badge color="red">Error</Badge>
			<Tooltip>{currentData.errorMessage}</Tooltip>
		{:else}
			{currentData.value}
		{/if}
	{/await}
</div>
