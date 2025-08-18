<script>
    import { getLogs, getLogConfigurations } from "./logsDisplay.remote";

</script>

<button onclick={() => getLogs().refresh()}>
Refresh
</button>
<svelte:boundary>
<pre>{JSON.stringify(await getLogs(),null,2)}
</pre>
<pre>{JSON.stringify(await getLogConfigurations(), null, 2)}</pre>
	{#snippet pending()}
		<p>loading...</p>
	{/snippet}
</svelte:boundary>