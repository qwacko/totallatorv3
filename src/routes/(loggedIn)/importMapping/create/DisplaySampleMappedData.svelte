<script lang="ts">
	import ObjectTable from '$lib/components/ObjectTable.svelte';
	import { processObject } from '$lib/helpers/importTransformation';
	import type { ImportMappingDetailSchema } from '$lib/schema/importMappingSchema';

	import { Button, Fileupload } from 'flowbite-svelte';
	import Papa from 'papaparse';

	export let mappingConfig: ImportMappingDetailSchema;

	export let csvData: Record<string, any>[] | undefined = undefined;

	$: rowsToSkip = mappingConfig.rowsToSkip;

	let rowNumber = 1;
	let currentFile: File | undefined = undefined;

	$: numberRows = csvData?.length ?? 1;

	const processFile = (file: File, numRows: number) => {
		Papa.parse(file, {
			header: true,
			beforeFirstChunk: function (chunk) {
				// Split the chunk into lines
				let lines = chunk.split(/\r\n|\r|\n/);
				// Skip the specified number of lines
				lines.splice(0, rowsToSkip);
				// Rejoin the remaining lines and return the modified chunk
				return lines.join('\n');
			},
			complete: function (results) {
				csvData = results.data as Record<string, unknown>[];
				rowNumber = 1;
			},
			error: function (error) {
				console.log('CSV Data Error', error);
				csvData = undefined;
				rowNumber = 1;
				numberRows = 1;
			},
			skipEmptyLines: true
		});
	};

	$: currentFile && processFile(currentFile, rowsToSkip);

	const updateFileValue = (event: Event) => {
		if (event?.target) {
			const target = event.target as HTMLInputElement;
			const files = target.files;
			if (files && files.length > 0) {
				const file = files[0];
				currentFile = file;
				console.log('File: ', file);
			} else {
				currentFile = undefined;
			}
		}
	};
</script>

<Fileupload on:change={updateFileValue} accept=".csv" />
{#if csvData}
	<div class="flex flex-row gap-10 items-center self-center">
		<Button
			color="light"
			outline
			on:click={() => (rowNumber = Math.max(1, rowNumber - 1))}
			disabled={rowNumber === 1}
		>
			Previous
		</Button>
		{rowNumber} / {numberRows}
		<Button
			color="light"
			outline
			on:click={() => (rowNumber = Math.min(numberRows, rowNumber + 1))}
			disabled={rowNumber === numberRows}
		>
			Next
		</Button>
	</div>
	<pre class="self-center">
        {JSON.stringify(csvData[rowNumber - 1], null, 2)}
    </pre>
	{@const processedData = processObject(csvData[rowNumber - 1], mappingConfig)}

	<ObjectTable data={processedData} />
{/if}
