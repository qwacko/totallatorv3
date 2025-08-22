<script>
	import ShowLogConfigurations from '$lib/components/logs/ShowLogConfigurations.svelte';
</script>

<svelte:boundary>
	<ShowLogConfigurations />

	{#snippet pending()}
		<p>loading...</p>
	{/snippet}
</svelte:boundary>
