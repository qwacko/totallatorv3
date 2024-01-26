<script lang="ts">
	import DisplayCurrency from '$lib/components/DisplayCurrency.svelte';
	import type { ReportElementNumberData } from '$lib/server/db/actions/helpers/report/getData';
	import { Spinner } from 'flowbite-svelte';

	export let data: ReportElementNumberData;
</script>

{#await data.data}
	<Spinner />
{:then currentData}
	<DisplayCurrency amount={currentData} positiveGreen />
{/await}
