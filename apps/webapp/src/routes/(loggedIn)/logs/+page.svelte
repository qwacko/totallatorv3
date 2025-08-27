<script lang="ts">
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
	import ShowLogs from '$lib/components/logs/ShowLogs.svelte';
</script>

<svelte:boundary>
	<ShowLogs />

	{#snippet pending()}
		<LoadingSpinner />
	{/snippet}
</svelte:boundary>
