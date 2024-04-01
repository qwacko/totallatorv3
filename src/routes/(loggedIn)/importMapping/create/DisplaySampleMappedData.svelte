<script lang="ts">
	import ObjectTable from '$lib/components/ObjectTable.svelte';
	import { processObject } from '$lib/helpers/importTransformation';
	import type { ImportMappingDetailSchema } from '$lib/schema/importMappingSchema';

	import { Badge, Button, Fileupload } from 'flowbite-svelte';
	import Papa from 'papaparse';
	import { z } from 'zod';

	export let mappingConfig: ImportMappingDetailSchema;

	export let csvData: Record<string, any>[] | undefined = undefined;

	$: rowsToSkip = mappingConfig.rowsToSkip;

	let rowNumber = 1;
	let currentFile: File | undefined = undefined;
	let importErrorMessage: string | undefined = undefined;

	$: numberRows = csvData?.length ?? 1;

	const processFile = (file: File, numRows: number) => {
		importErrorMessage = undefined;
		console.log('File Type : ', file.type);

		if (file.type === 'text/csv') {
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
					importErrorMessage = 'CSV Data Error';
					console.log('CSV Data Error', error);
					csvData = undefined;
					rowNumber = 1;
					numberRows = 1;
				},
				skipEmptyLines: true
			});
		} else {
			try {
				file
					.text()
					.then((text) => {
						const newJsonData = JSON.parse(text) as Record<string, unknown>[];

						const dataSchema = z.array(z.record(z.any()));

						const parsedData = dataSchema.safeParse(newJsonData);

						if (parsedData.success === false) {
							importErrorMessage = 'Invalid JSON Data';
							console.log('Invalid JSON Data', parsedData.error);
						} else {
							csvData = parsedData.data;
							rowNumber = 1;
						}
					})
					.catch((e) => {
						importErrorMessage = 'Import Error';
						console.log('Error reading file', e);
					});
			} catch (e) {
				console.log('Error parsing JSON', e);
				importErrorMessage = 'Import Error';
			}

			// importErrorMessage = 'Invalid File Type';
			// console.log('Invalid File Type');
		}
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

{#if importErrorMessage}
	<Badge color="red">{importErrorMessage}</Badge>
{/if}
<Fileupload on:change={updateFileValue} accept=".csv,.data,.json" />
{#if csvData}
	<div class="flex flex-row items-center gap-10 self-center">
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
	{@const processedData = processObject(csvData[rowNumber - 1], mappingConfig)}
	<ObjectTable data={processedData} />
	<pre class="self-center">
        {JSON.stringify(csvData[rowNumber - 1], null, 2)}
    </pre>
{/if}
