<script lang="ts">
	import DisplayCurrency from '$lib/components/DisplayCurrency.svelte';
	import type { ReportConfigPartWithData_NumberCurrency } from '$lib/server/db/actions/helpers/report/getData';
	import { Spinner } from 'flowbite-svelte';

	export let data: ReportConfigPartWithData_NumberCurrency;
</script>

<div class="flex h-full w-full items-center justify-center">
	{#await data.data}
		<Spinner />
	{:then currentData}
		{#if data.type === 'currency'}
			<DisplayCurrency amount={currentData} format="USD" positiveGreen />
		{:else}
			{currentData}
		{/if}
	{/await}
</div>
