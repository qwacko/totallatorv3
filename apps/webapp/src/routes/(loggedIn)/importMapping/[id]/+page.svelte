<script lang="ts">
  import { Button, P } from "flowbite-svelte";
  import { superForm } from "sveltekit-superforms";
  import { zod4Client } from "sveltekit-superforms/adapters";

  import { importMappingDetailSchema } from "@totallator/shared";

  import CustomHeader from "$lib/components/CustomHeader.svelte";
  import ImportLinkList from "$lib/components/ImportLinkList.svelte";
  import PageLayout from "$lib/components/PageLayout.svelte";
  import { urlGenerator } from "$lib/routes";

  import ImportMappingForm from "../create/ImportMappingForm.svelte";

  const { data } = $props();

  const form = superForm(data.form);
  const detailForm = superForm(data.detailForm, {
    validators: zod4Client(importMappingDetailSchema),
    validationMethod: "oninput",
  });
</script>

<CustomHeader pageTitle="Edit Import Mapping - {data.importMapping.title}" />

<PageLayout title="Edit Import Mapping" subtitle={data.importMapping.title}>
  <div class="flex flex-row flex-wrap items-center gap-2">
    {#if data.autoImports.data.length > 0}
      <P weight="bold">Auto Imports</P>
      {#each data.autoImports.data as autoImport}
        <Button
          href={urlGenerator({
            address: "/(loggedIn)/autoImport/[id]",
            paramsValue: { id: autoImport.id },
          }).url}
          color="light"
        >
          {autoImport.title}
        </Button>
      {/each}
    {/if}
  </div>
  <ImportMappingForm
    {form}
    {detailForm}
    submitButtonText="Update Import Mapping"
    csvData={data.importMapping.sampleData
      ? JSON.parse(data.importMapping.sampleData)
      : undefined}
  />
  {#await data.imports then importList}
    <ImportLinkList
      title="Last {data.importFilter.pageSize} Imports"
      data={importList.details}
      filter={data.importFilter}
    />
  {/await}
</PageLayout>
