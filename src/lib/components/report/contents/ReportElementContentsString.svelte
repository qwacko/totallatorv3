<script lang="ts">
	import type { ReportConfigPartWithData_String } from '$lib/server/db/actions/helpers/report/getData';
	import { Badge, Spinner, Tooltip } from 'flowbite-svelte';

	export let data: ReportConfigPartWithData_String;
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
