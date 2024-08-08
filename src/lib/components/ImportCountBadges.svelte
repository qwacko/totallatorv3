<script lang="ts">
	import type { ImportDetail } from '$lib/server/db/actions/importActions';
	import { Badge } from 'flowbite-svelte';

	const {
		importData,
		hideZero = false
	}: {
		importData: ImportDetail;
		hideZero?: boolean;
	} = $props();

	const errorCount = $derived(
		importData.detail.importDetails.filter((d) => d.status === 'error').length
	);
	const importErrorCount = $derived(
		importData.detail.importDetails.filter((d) => d.status === 'importError').length
	);
	const processCount = $derived(
		importData.detail.importDetails.filter((d) => d.status === 'processed').length
	);
	const importCount = $derived(
		importData.detail.importDetails.filter((d) => d.status === 'imported').length
	);
	const duplicateCount = $derived(
		importData.detail.importDetails.filter((d) => d.status === 'duplicate').length
	);
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
