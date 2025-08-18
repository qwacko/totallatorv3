<script lang="ts">
    import ShowLogs from "$lib/components/logs/ShowLogs.svelte";

</script>

<svelte:boundary>

    <ShowLogs />
    
	{#snippet pending()}
		<p>loading...</p>
	{/snippet}
</svelte:boundary>