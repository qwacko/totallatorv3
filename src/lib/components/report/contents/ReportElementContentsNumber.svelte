<script lang="ts">
	import DisplayCurrency from '$lib/components/DisplayCurrency.svelte';
	import type { ReportConfigPartWithData_NumberCurrency } from '$lib/server/db/actions/helpers/report/getData';
	import { Badge, Spinner, Tooltip } from 'flowbite-svelte';

	const {data} : { data: ReportConfigPartWithData_NumberCurrency} = $props();
</script>

<div class="flex h-full w-full items-center justify-center">
	{#await data.data}
		<Spinner />
	{:then currentData}
		{#if currentData && currentData.error != undefined}
			<Badge color="red">Error</Badge>
			<Tooltip>{currentData.errorMessage}</Tooltip>
		{:else if data.numberDisplay === 'currency'}
			<DisplayCurrency amount={currentData.value} positiveGreen />
		{:else if data.numberDisplay === 'percent'}
			{currentData.value.toFixed(0)}%
		{:else if data.numberDisplay === 'percent2dp'}
			{currentData.value.toFixed(2)}%
		{:else if data.numberDisplay === 'number'}
			{currentData.value.toFixed(0)}
		{:else if data.numberDisplay === 'number2dp'}
			{currentData.value.toFixed(2)}
		{:else}
			{currentData.value}
		{/if}
	{/await}
</div>
