<script lang="ts">
  import { Badge, Button, Fileupload } from "flowbite-svelte";
  import Papa from "papaparse";
  import { untrack } from "svelte";
  import * as z from "zod";

  import type { ImportMappingDetailSchema } from "@totallator/shared";

  import ObjectTable from "$lib/components/ObjectTable.svelte";
  import { processObject } from "$lib/helpers/importTransformation";

  let {
    mappingConfig,
    csvData = $bindable(undefined),
  }: {
    mappingConfig: ImportMappingDetailSchema;
    csvData?: Record<string, any>[] | undefined;
  } = $props();

  const rowsToSkip = $derived(mappingConfig.rowsToSkip);

  let rowNumber = $state(1);
  let currentFile = $state<File | undefined>(undefined);
  let importErrorMessage = $state<string | undefined>(undefined);

  let numberRows = $state(csvData?.length ?? 1);

  const processFile = (file: File, numRows: number) => {
    importErrorMessage = undefined;

    if (file.type === "text/csv") {
      Papa.parse(file, {
        header: true,
        beforeFirstChunk: function (chunk) {
          // Split the chunk into lines
          let lines = chunk.split(/\r\n|\r|\n/);
          // Skip the specified number of lines
          lines.splice(0, rowsToSkip);
          // Rejoin the remaining lines and return the modified chunk
          return lines.join("\n");
        },
        complete: function (results) {
          csvData = results.data as Record<string, unknown>[];
          rowNumber = 1;
        },
        error: function (error) {
          importErrorMessage = "CSV Data Error";
          csvData = undefined;
          rowNumber = 1;
          numberRows = 1;
        },
        skipEmptyLines: true,
      });
    } else {
      try {
        file
          .text()
          .then((text) => {
            const newJsonData = JSON.parse(text) as Record<string, unknown>[];

            const dataSchema = z.array(z.record(z.string(), z.any()));

            const parsedData = dataSchema.safeParse(newJsonData);

            if (parsedData.success === false) {
              importErrorMessage = "Invalid JSON Data";
            } else {
              csvData = parsedData.data;
              rowNumber = 1;
            }
          })
          .catch((e) => {
            importErrorMessage = "Import Error";
          });
      } catch (e) {
        importErrorMessage = "Import Error";
      }
    }
  };

  $effect(
    () => currentFile && untrack(() => processFile)(currentFile, rowsToSkip),
  );

  const updateFileValue = (event: Event) => {
    if (event?.target) {
      const target = event.target as HTMLInputElement;
      const files = target.files;
      if (files && files.length > 0) {
        const file = files[0];
        currentFile = file;
      } else {
        currentFile = undefined;
      }
    }
  };
</script>

{#if importErrorMessage}
  <Badge color="red">{importErrorMessage}</Badge>
{/if}
<Fileupload onchange={updateFileValue} accept=".csv,.data,.json" />
{#if csvData}
  <div class="flex flex-row items-center gap-10 self-center">
    <Button
      color="light"
      outline
      onclick={() => (rowNumber = Math.max(1, rowNumber - 1))}
      disabled={rowNumber === 1}
    >
      Previous
    </Button>
    {rowNumber} / {numberRows}
    <Button
      color="light"
      outline
      onclick={() => (rowNumber = Math.min(numberRows, rowNumber + 1))}
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
