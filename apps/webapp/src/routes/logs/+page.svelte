<script>
    import { getLogs } from "./logsDisplay.remote";

    let display = $state(false);


</script>
<button onclick={() => display = true}>
Show Logs
</button>
{#if display}
<button onclick={() => getLogs().refresh()}>
Refresh
</button>
<svelte:boundary>
<pre>{JSON.stringify(await getLogs(),null,2)}
</pre>
	{#snippet pending()}
		<p>loading...</p>
	{/snippet}
</svelte:boundary>
{/if}