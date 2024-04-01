<script lang="ts">
	import type { ImportDetail } from '$lib/server/db/actions/importActions';
	import { Badge } from 'flowbite-svelte';

	export let importData: ImportDetail;
	export let hideZero: boolean = false;

	$: errorCount = importData.detail.importDetails.filter((d) => d.status === 'error').length;
	$: importErrorCount = importData.detail.importDetails.filter(
		(d) => d.status === 'importError'
	).length;
	$: processCount = importData.detail.importDetails.filter((d) => d.status === 'processed').length;
	$: importCount = importData.detail.importDetails.filter((d) => d.status === 'imported').length;
	$: duplicateCount = importData.detail.importDetails.filter(
		(d) => d.status === 'duplicate'
	).length;
</script>

{#if !hideZero || processCount > 0}
	<Badge color="blue">Processed: {processCount}</Badge>
{/if}
{#if !hideZero || errorCount > 0}
	<Badge color="red">Error: {errorCount}</Badge>
{/if}
{#if !hideZero || importErrorCount > 0}
	<Badge color="red">Import Error: {importErrorCount}</Badge>
{/if}
{#if !hideZero || duplicateCount > 0}
	<Badge color="dark">Duplicate: {duplicateCount}</Badge>
{/if}
{#if !hideZero || importCount > 0}
	<Badge color="green">Imported: {importCount}</Badge>
{/if}
