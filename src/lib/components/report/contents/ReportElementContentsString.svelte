<script lang="ts">
	import type { ReportConfigPartWithData_String } from '$lib/server/db/actions/helpers/report/getData';
	import { Spinner } from 'flowbite-svelte';

	export let data: ReportConfigPartWithData_String;
</script>

<div class="flex h-full w-full items-center justify-center">
	{#await data.data}
		<Spinner />
	{:then currentData}
		{currentData}
	{/await}
</div>
