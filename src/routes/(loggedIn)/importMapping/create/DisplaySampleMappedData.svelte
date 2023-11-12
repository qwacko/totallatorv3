<script lang="ts">
	import ObjectTable from '$lib/components/ObjectTable.svelte';
	import { processObject } from '$lib/helpers/importTransformation';
	import type { ImportMappingDetailSchema } from '$lib/schema/importMappingSchema';

	import { Button, Fileupload } from 'flowbite-svelte';
	import Papa from 'papaparse';

	export let mappingConfig: ImportMappingDetailSchema;

	let csvData: Record<string, any> | undefined = undefined;
	let csvErrors: Papa.ParseError[] | Error | undefined = undefined;
	let rowNumber = 1;
	let numberRows = 1;

	const updateFileValue = (event: Event) => {
		if (event?.target) {
			const target = event.target as HTMLInputElement;
			const files = target.files;
			if (files && files.length > 0) {
				const file = files[0];
				console.log('File: ', file);
				Papa.parse(file, {
					header: true,
					complete: function (results) {
						console.log('New CSV Data');
						csvErrors = results.errors;
						csvData = results.data;
						rowNumber = 1;
						numberRows = results.data.length;
					},
					error: function (error) {
						console.log('CSV Data Error');
						csvErrors = error;
						csvData = undefined;
						rowNumber = 1;
						numberRows = 1;
					}
				});
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
